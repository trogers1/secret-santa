// types.ts
export interface Person {
  id: string;
  name: string;
  email: string;
}

export interface Assignment {
  giverId: string;
  receiverId: string;
}

export interface Constraints {
  illegalPairings: Array<[string, string]>; // [giverId, receiverId]
  groups?: Array<string[]>; // People who shouldn't be assigned within their own group
}

export interface SecretSantaConfig {
  people: Person[];
  constraints?: Constraints;
  allowSelfAssignment?: boolean;
}
