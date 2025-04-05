export interface DayOpenHours {
  open: string;
  close: string;
}

export interface OpenHours {
  monday: DayOpenHours;
  tuesday: DayOpenHours;
  wednesday: DayOpenHours;
  thursday: DayOpenHours;
  friday: DayOpenHours;
  saturday: DayOpenHours;
  sunday: DayOpenHours;
}

export interface ImageSet {
  image1: string;
  image2: string;
  image3: string;
  image4: string;
}

export interface CreateBrand {
  brand: string;
  logo: string;
  imageSet: ImageSet;
  humanReadableId: string;
  openHours: OpenHours;
}

export interface Brand extends CreateBrand {
  id: number;
  tenantId: number;
  business: string;
}
