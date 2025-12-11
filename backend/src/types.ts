export interface LoginResponse {
  user: {
    username: string;
    email: string;
    plan_type: string;
    is_test: number;
    valid_from?: string;
    valid_to?: string;
    name?: string;
  };
  usage: {
    limit: number;
    used: number;
    remaining: number;
  };
  token: string;
}

export interface TarotReadingRequest {
  cardName: string;
  positionLabel: string;
  spreadName: string;
  isReversed: boolean;
  language: string;
}

export interface FullSpreadCard {
  name: string;
  position: string;
  isReversed: boolean;
  meaning: string;
}

export interface FullSpreadRequest {
  spreadName: string;
  cards: FullSpreadCard[];
  language: string;
}

