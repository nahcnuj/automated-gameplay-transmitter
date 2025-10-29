type CommentData = {
  id: string
  no?: number
  userId: string
  name: string
  comment: string
  timestamp: string
  isOwner: boolean
  anonymity?: boolean
  hasGift: boolean
  origin: any
};

export type Comment = {
  data: CommentData
};
