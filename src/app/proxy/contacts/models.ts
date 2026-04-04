
export interface ContactCheckInputDto {
  phoneNumbers: string[];
}

export interface ContactCheckResultDto {
  registered: RegisteredContactDto[];
  unregistered: string[];
}

export interface RegisteredContactDto {
  phoneNumber?: string;
  name?: string;
  actorType?: string;
}
