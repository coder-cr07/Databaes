export type TrackingStatus = "idle" | "tracking" | "success";

export type Product = {
  id: string;
  name: string;
  image: string;
  price: number;
  confidence: number;
};
