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

  // Check temperature (all temps should be above 10°C)
  const lowTemp = Math.min(...temperatures);
  if (lowTemp < 10) {
    safe = false;
    warnings.push(`Temperature too low: ${lowTemp}°C`);
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
    warnings.push(`Strong winds: ${windSpeed} km/h`);
  }

  return { safe, warnings };
}