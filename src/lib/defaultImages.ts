export function getDefaultImage(type?: string): string {
  switch (type?.toLowerCase()) {
    case "garage":
      return "/images/default-garage.svg";
    case "shop":
    case "market":
    case "commercial_complex":
      return "/images/default-shop.svg";
    case "apartment":
    case "duplex":
      return "/images/default-apartment.svg";
    case "flat":
    case "room":
    case "sublet":
    case "mess":
    case "hostel":
    case "tin_shed":
    case "slum":
    case "semi_pucca":
      return "/images/default-room.svg";
    case "house":
    case "land":
    case "plot":
    case "office":
    case "warehouse":
    case "factory":
      return "/images/default-property.svg";
    default:
      return "/images/default-property.svg";
  }
}
