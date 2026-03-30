import { mapEnumToOptions } from '@abp/ng.core';

export enum AdvertiserType {
  Teacher = 0,
  Library = 1,
  Bookstore = 2,
  EducationalCenter = 3,
  Other = 4,
  Clothes = 5,
  CoffeeShop = 6,
  Restaurant = 7,
  Juices = 8,
  Gym = 9,
  SchoolSupplies = 10,
  Technology = 11,
  Health = 12,
  Education = 13,
  Entertainment = 14,
}

export const advertiserTypeOptions = mapEnumToOptions(AdvertiserType);
