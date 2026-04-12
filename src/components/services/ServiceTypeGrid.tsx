import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  User, UtensilsCrossed, Car, Bus, Stethoscope, Flower2, Baby, Milk,
  Newspaper, Shirt, Sparkles, GraduationCap, Dumbbell, Heart, Dog,
  Trophy, Home, Zap, Wrench, Hammer, Bug, Wind, Droplets, Recycle,
  Wifi, Tv, Package, Users, HelpCircle
} from "lucide-react";

export const SERVICE_TYPES = [
  { value: "maid", bn: "কাজের বউ", en: "Maid", icon: User },
  { value: "cook", bn: "রাঁধুনি", en: "Cook", icon: UtensilsCrossed },
  { value: "driver", bn: "ড্রাইভার", en: "Driver", icon: Car },
  { value: "school_bus", bn: "স্কুল বাস", en: "School Bus", icon: Bus },
  { value: "doctor", bn: "ডাক্তার", en: "Doctor", icon: Stethoscope },
  { value: "gardener", bn: "মালি", en: "Gardener", icon: Flower2 },
  { value: "nanny", bn: "আয়া", en: "Nanny", icon: Baby },
  { value: "milkman", bn: "দুধওয়ালা", en: "Milkman", icon: Milk },
  { value: "newspaper", bn: "পত্রিকা", en: "Newspaper", icon: Newspaper },
  { value: "laundry", bn: "লন্ড্রি", en: "Laundry", icon: Shirt },
  { value: "car_cleaner", bn: "গাড়ি ধোয়া", en: "Car Cleaner", icon: Sparkles },
  { value: "tuition_teacher", bn: "টিউশন শিক্ষক", en: "Tuition Teacher", icon: GraduationCap },
  { value: "gym_instructor", bn: "জিম প্রশিক্ষক", en: "Gym Instructor", icon: Dumbbell },
  { value: "yoga_instructor", bn: "যোগ প্রশিক্ষক", en: "Yoga Instructor", icon: Heart },
  { value: "pet_walker", bn: "পোষা প্রাণী ওয়াকার", en: "Pet Walker", icon: Dog },
  { value: "sports_teacher", bn: "খেলা শিক্ষক", en: "Sports Teacher", icon: Trophy },
  { value: "house_keeper", bn: "হাউস কিপার", en: "House Keeper", icon: Home },
  { value: "electrician", bn: "ইলেকট্রিশিয়ান", en: "Electrician", icon: Zap },
  { value: "plumber", bn: "প্লাম্বার", en: "Plumber", icon: Wrench },
  { value: "carpenter", bn: "কাঠমিস্ত্রি", en: "Carpenter", icon: Hammer },
  { value: "pest_control", bn: "পেস্ট কন্ট্রোল", en: "Pest Control", icon: Bug },
  { value: "ac_service", bn: "এসি সার্ভিসিং", en: "AC Service", icon: Wind },
  { value: "blood_test", bn: "রক্ত পরীক্ষা", en: "Blood Test", icon: Droplets },
  { value: "scrap_dealer", bn: "ভাঙ্গারি", en: "Scrap Dealer", icon: Recycle },
  { value: "internet_repair", bn: "ইন্টারনেট মেরামত", en: "Internet Repair", icon: Wifi },
  { value: "cable_tv", bn: "কেবল/টিভি", en: "Cable/TV", icon: Tv },
  { value: "maid_pickup", bn: "মেইড পিকআপ", en: "Maid Pickup", icon: Package },
  { value: "staff", bn: "স্টাফ", en: "Staff", icon: Users },
  { value: "other", bn: "অন্যান্য", en: "Other", icon: HelpCircle },
];

interface Props {
  selected: string;
  onSelect: (value: string) => void;
}

export function ServiceTypeGrid({ selected, onSelect }: Props) {
  const { language } = useLanguage();

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
      {SERVICE_TYPES.map(type => {
        const Icon = type.icon;
        const isSelected = selected === type.value;
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onSelect(type.value)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors",
              isSelected
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border hover:border-primary/50 hover:bg-accent text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-center leading-tight">{language === "bn" ? type.bn : type.en}</span>
          </button>
        );
      })}
    </div>
  );
}
