import React, { useState, useEffect } from 'react';
import { Recycle as Motorcycle, AlertTriangle, Search } from 'lucide-react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from './components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { kelvinToCelsius, isRidingSafe } from './lib/utils';

const ROMANIA_CITIES = [
  "Alba Iulia", "Arad", "Bacău", "Baia Mare", "Bistrița", "Botoșani", "Brăila", "Brașov", "București",
  "Buzău", "Călărași", "Cluj-Napoca", "Constanța", "Craiova", "Deva", "Drobeta-Turnu Severin",
  "Focșani", "Galați", "Giurgiu", "Iași", "Miercurea Ciuc", "Oradea", "Piatra Neamț", "Pitești",
  "Ploiești", "Râmnicu Vâlcea", "Reșița", "Roman", "Satu Mare", "Sfântu Gheorghe", "Sibiu",
  "Sighetu Marmației", "Slatina", "Slobozia", "Suceava", "Târgoviște", "Târgu Jiu", "Târgu Mureș",
  "Timișoara", "Tulcea", "Turda", "Vaslui", "Zalău"
];

function App() {
  const [open, setOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    const saved = localStorage.getItem('selectedCity');
    return saved || '';
  });
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCity) {
      localStorage.setItem('selectedCity', selectedCity);
      fetchWeather(selectedCity);
    }
  }, [selectedCity]);

  const fetchWeather = async (city: string) => {
    setLoading(true);
    setError(null);
    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      if (!apiKey) {
        throw new Error('Weather API key is not configured');
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city},ro&appid=${apiKey}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherStatus = () => {
    if (!weather) return null;

    const dayHours = weather.list
      .filter((item: any) => {
        const hour = new Date(item.dt * 1000).getHours();
        return hour >= 8 && hour <= 18;
      })
      .map((item: any) => ({
        temp: kelvinToCelsius(item.main.temp),
        rain: {
          probability: item.pop,
          volume: item.rain?.['3h'] || 0
        },
        windSpeed: Math.round(item.wind.speed * 3.6) // Convert m/s to km/h and round
      }));

    const temperatures = dayHours.map((h: any) => h.temp);
    const rain = dayHours.map((h: any) => h.rain);
    const maxWindSpeed = Math.max(...dayHours.map((h: any) => h.windSpeed));

    return isRidingSafe(temperatures, rain, maxWindSpeed);
  };

  const status = getWeatherStatus();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Motorcycle Weather Check</h1>
          <p className="text-gray-400">Check if it's safe to ride today</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-300">
          <h2 className="font-semibold mb-2 text-gray-200">Safety Criteria:</h2>
          <ul className="space-y-1">
            <li>• Temperature must be above 10°C during commute hours (8-9AM and 4-6PM)
              <ul className="ml-4 mt-1 text-gray-400">
                <li>- Below 5°C: Not safe to ride</li>
                <li>- 5-10°C: Ride with caution</li>
              </ul>
            </li>
            <li>• No heavy rain ({'>'}7mm/h) during commute hours</li>
            <li>• Light rain during commute will show a caution warning</li>
            <li>• Wind speed criteria:
              <ul className="ml-4 mt-1 text-gray-400">
                <li>- Above 50 km/h: Not safe to ride</li>
                <li>- 20-50 km/h: Ride with caution</li>
              </ul>
            </li>
          </ul>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              {selectedCity || "Select a city"}
              <Search className="h-4 w-4 text-gray-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search Romanian city..." />
              <CommandList>
                <CommandEmpty>No city found.</CommandEmpty>
                <CommandGroup>
                  {ROMANIA_CITIES.map((city) => (
                    <CommandItem
                      key={city}
                      onSelect={() => {
                        setSelectedCity(city);
                        setOpen(false);
                      }}
                    >
                      {city}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
            {error}
          </div>
        )}

        {status && (
          <div className={`rounded-lg p-6 ${status.safe ? 'bg-green-900/50 border border-green-500' : 'bg-red-900/50 border border-red-500'}`}>
            <div className="flex items-center justify-center mb-4">
              {status.safe ? (
                <Motorcycle className="h-16 w-16 text-green-400" />
              ) : (
                <AlertTriangle className="h-16 w-16 text-red-400" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-center mb-4">
              {status.safe ? "It's safe to ride!" : "Not recommended to ride"}
            </h2>
            {status.warnings.length > 0 && (
              <ul className="space-y-2">
                {status.warnings.map((warning, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    {warning}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;