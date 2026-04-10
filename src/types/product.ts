export type TrackingStatus = "idle" | "tracking" | "success";

export type Product = {
  id: string;
  title: string;
  image: string;
  price: number;
  link: string;
};
