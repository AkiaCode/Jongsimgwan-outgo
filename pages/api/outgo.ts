import { NextApiRequest, NextApiResponse } from 'next'
import { verify } from 'jsonwebtoken'
import knex from 'knex'
import { parse } from 'cookieparser'

const db = knex({ client: 'mysql', connection: { host: 'localhost', port: 3306, database: 'outgo', user: 'outgo' } })

export default async function outgoApi (req : NextApiRequest, res: NextApiResponse) {
  if (!req.headers.cookie) return res.json({ success: false, msg: '토큰이 없습니다.' })
  const { token } = parse(req.headers.cookie)
  if (!token) return res.json({ success: false, msg: '토큰이 없습니다.' })

  try {
    const decode = verify(token, process.env.JWT_TOKEN) as { id: string }
    const [exist] = await db.select('*').where({ id: decode.id }).from('outgo')
    if (!exist) {
      await db.insert({ id: exist.id, createAt: Date.now() }).into('outgo')
      return res.json({ success: true, msg: '성공적으로 잔류주 잔류(을)를 선택하였습니다' })
    } else {
      await db.select('*').where({ id : token.id }).from('outgo').del()
      return res.json({ success: true, msg: '성공적으로 잔류주 외출(을)를 선택하였습니다' })
    }
  } catch (err) { return res.json({ success: false, msg: '잘못된 형식의 토큰입니다', err })}
}
