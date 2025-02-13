import { NextApiRequest, NextApiResponse } from 'next'
import { parse } from 'cookieparser'
import { verify } from 'jsonwebtoken'
import knex from 'knex'
import { readFileSync } from 'fs'
import path from 'path'
import { getWeekNumber, getDateNumber } from '../../utils'

const db = knex({ client: 'mysql', connection: { host: 'localhost', port: 3306, database: 'outgo', user: 'outgo' } })
const outweeks = JSON.parse(readFileSync(path.resolve() + '/data/date.json').toString('utf-8'))

export default async function statusApi (req: NextApiRequest, res: NextApiResponse) {
  if (!req.headers.cookie) return res.json({ redirect: '/login' })

  const { token } = parse(req.headers.cookie)
  if (!token) return res.json({ redirect: '/login' })

  try {
    const decode = verify(token, process.env.JWT_TOKEN) as { id: string }
    const [user] = await db.select('*').where({ id: decode.id }).from('user')
    if (!user) return res.json({ redirect: '/login' })
    const { id, grade, class: classid, nickname, num } = user

    const thisweek = getWeekNumber(new Date())
    const outgoweek = outweeks.filter((_, i) => i + 10 > thisweek).sort((a, b) => a.week - b.week)[0]

    if (!outgoweek) return res.json({ user: { id, grade, class: classid, nickname, num }, dday: '?' })

    const [year, month, date] = outgoweek.date.split('-')
    const dday = getDateNumber(new Date(year, (month as number) - 1, date)) - getDateNumber(new Date())

    const [outgo] = await db.select('*').where({ id }).from('outgo')

    return res.json({ user: { id, grade, class: classid, nickname, num }, dday, isGo: !!outgo, reason: outgo?.reason || '', canGo: outgoweek.canGo })
  } catch (err) { return res.json({ redirect: '/login' }) }
}
