export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  status: "ACTIVE" | "INACTIVE";
}