import { NextApiRequest, NextApiResponse } from 'next'
import { verify } from 'jsonwebtoken'
import knex from 'knex'
import path from 'path'
import { parse } from 'cookieparser'
import { readFileSync } from 'fs'
import { getWeekNumber } from '../../utils'

const db = knex({ client: 'mysql', connection: { host: 'localhost', port: 3306, database: 'outgo', user: 'outgo' } })
const outweeks = JSON.parse(readFileSync(path.resolve() + '/data/date.json').toString('utf-8'))

export default async function outgoApi (req : NextApiRequest, res: NextApiResponse) {
  if (!req.headers.cookie) return res.json({ success: false, msg: '토큰이 없습니다.' })
  const { reason = '' } = req.body
  const { token } = parse(req.headers.cookie)
  if (!token) return res.json({ success: false, msg: '토큰이 없습니다.' })
  if (reason.length < 10) return res.json({ success: false, msg: '출사 사유를 자세히 적어주세요. (최소 10자)' })

  const thisweek = getWeekNumber(new Date())
  const outgoweek = outweeks.filter((_, i) => i + 10 > thisweek).sort((a, b) => a.week - b.week)[0]

  if (!outgoweek.canGo) return res.json({ success: false, msg: '의무 출사주 입니다.' })

  try {
    const decode = verify(token, process.env.JWT_TOKEN) as { id: string }
    const [exist] = await db.select('*').where({ id: decode.id }).from('outgo')
    if (!exist) {
      await db.insert({ id: decode.id, reason }).into('outgo')
      return res.json({ success: true, msg: '성공적으로 잔류주 잔류(을)를 선택하였습니다' })
    } else {
      await db.select('*').where({ id: decode.id }).from('outgo').del()
      return res.json({ success: true, msg: '성공적으로 잔류주 외출(을)를 선택하였습니다' })
    }
  } catch (err) { console.log(err); return res.json({ success: false, msg: '잘못된 형식의 토큰입니다', err }) }
}
