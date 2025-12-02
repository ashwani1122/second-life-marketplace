export type NotificationRow = {
  id: string
  user_id: string
  actor_id: string | null
  type: string | null
  payload: any
  read: boolean
  created_at: string
  title: string | null
  body: string | null
  data: any
}