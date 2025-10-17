type CommentData = {
  id: string
  no?: number
  userId: string
  name: string
  comment: string
  timestamp: string
  isOwner: boolean
  origin: any
  hasGift: boolean
};

export type Comment = {
  data: CommentData
};
