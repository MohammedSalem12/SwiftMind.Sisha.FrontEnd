
export interface ShareKnowledgeCardDto {
  knowledgeCardId: number;
  recipientUserId: string;
  message?: string;
  cardTitleAr?: string;
  cardTitleEn?: string;
  cardContentAr?: string;
  cardContentEn?: string;
  cardTopic?: string;
}

export interface SharedKnowledgeCardDto {
  id?: string;
  knowledgeCardId: number;
  cardTitleAr?: string;
  cardTitleEn?: string;
  cardContentAr?: string;
  cardContentEn?: string;
  cardTopic?: string;
  senderName?: string;
  message?: string;
  isRead: boolean;
  creationTime?: string;
}

export interface UserSearchResultDto {
  userId?: string;
  displayName?: string;
  code?: string;
  role?: string;
}
