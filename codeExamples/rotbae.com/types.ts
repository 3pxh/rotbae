export interface GeneratedMedia {
  url: string;
  prompt: string;
  type: 'image' | 'video';
  timestamp: number;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  placeholderUrl: string;
}
