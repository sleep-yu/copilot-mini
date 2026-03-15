export interface Entity {
  name: string;
  value: any;
  offset?: {
    start: number;
    end: number;
  };
}
