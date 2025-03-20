import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function kelvinToCelsius(kelvin: number): number {
  return Math.round(kelvin - 273.15);
}

export function isRidingSafe(
  temperatures: number[],
  rain: { probability: number; volume: number }[],
  windSpeed: number
): {
  safe: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let safe = true;

  // Check temperature during commute hours (8-9AM and 4-6PM)
  const commuteTemps = temperatures.filter((_, i) => i === 8 || i === 16 || i === 17);
  const lowTemp = Math.min(...commuteTemps);
  if (lowTemp < 10) {
    if (lowTemp < 5) {
      safe = false;
      warnings.push(`Temperature too low during commute: ${lowTemp}°C`);
    } else {
      warnings.push(`Cool temperature during commute: ${lowTemp}°C - ride with caution`);
    }
  }

  // Check rain during commute hours (8-9AM and 4-6PM)
  const commuteRain = rain.filter((_, i) => i === 8 || i === 16 || i === 17);
  const hasHeavyRain = commuteRain.some(r => r.volume > 7); // mm/h
  const hasLightRain = commuteRain.some(r => r.volume > 0);

  if (hasHeavyRain) {
    safe = false;
    warnings.push('Heavy rain during commute hours');
  } else if (hasLightRain) {
    warnings.push('Light rain during commute - ride with caution');
  }

  // Check wind speed (anything above 50 km/h is considered strong)
  if (windSpeed > 50) {
    safe = false;
    warnings.push(`Strong winds: ${Math.round(windSpeed)} km/h`);
  } else if (windSpeed >= 30) {
    warnings.push(`Moderate winds: ${Math.round(windSpeed)} km/h - ride with caution`);
  }

  return { safe, warnings };
}