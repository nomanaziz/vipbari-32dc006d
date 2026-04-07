export function getDefaultImage(type?: string): string {
  switch (type?.toLowerCase()) {
    case "garage":
      return "/images/default-garage.svg";
    case "shop":
      return "/images/default-shop.svg";
    case "apartment":
      return "/images/default-apartment.svg";
    case "flat":
    case "room":
    case "sublet":
    case "mess":
    case "hostel":
    case "tin_shed":
      return "/images/default-room.svg";
    case "house":
    case "land":
      return "/images/default-property.svg";
    default:
      return "/images/default-property.svg";
  }
}
