import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types.js'
import { SnakeToCamelKeys, camelToSnakeObject, snakeToCamelObject } from '@/types/casing.js'


export type NotificationMethod = 'REQUEST' | 'CANCEL'
export type NotificationStatus = 'pending' | 'sent' | 'failed'

export type NotificationSendRow = Tables<'notification_sends'>
export type NotificationSendInsert = TablesInsert<'notification_sends'>
export type NotificationSendUpdate = TablesUpdate<'notification_sends'>

export type NotificationSend = SnakeToCamelKeys<NotificationSendRow>
export type CreateNotificationSend = Omit<SnakeToCamelKeys<NotificationSendInsert>, 'id'>
export type UpdateNotificationSend = { id: string } & SnakeToCamelKeys<Omit<NotificationSendUpdate, 'id'>>

export const NotificationSendMapper = {
	insertToDb(insert: CreateNotificationSend): NotificationSendInsert {
		const mapped = camelToSnakeObject(insert) as NotificationSendInsert
		return mapped
	},
	updateToDb(update: UpdateNotificationSend): NotificationSendUpdate {
		const { id, ...rest } = update
		const mapped = camelToSnakeObject(rest) as NotificationSendUpdate
		return { id, ...mapped }
	},
	fromDb(row: NotificationSendRow): NotificationSend {
		const domain = snakeToCamelObject(row) as NotificationSend
		return domain
	},
}

export type NotificationSendKey = {
	uid: string
	sequence: number
	attendeeEmail: string
	method: NotificationMethod
}


