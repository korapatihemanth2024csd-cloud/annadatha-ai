import { createFileRoute } from "@tanstack/react-router";
import { CloudRain, Compass, Droplets, Eye, Gauge, Loader2, MapPin, Navigation, Sunrise, Sunset, Thermometer, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader, StatCard } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/weather")({
  head: () => ({
    meta: [
      { title: "Weather — Annadatha AI" },
      { name: "description", content: "Live local weather and 7-day forecast for farm planning." },
      { property: "og:title", content: "Farm Weather Forecast — Annadatha AI" },
      { property: "og:description", content: "Temperature, humidity, rainfall and wind for your village." },
    ],
  }),
  component: WeatherPage,
});

type WeatherData = {
  locationName: string;
  lat: number;
  lon: number;
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    precipitation: number;
    weatherCode: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
  };
  daily: {
    time: string[];
    weatherCode: number[];
    tempMax: number[];
    tempMin: number[];
    sunrise: string[];
    sunset: string[];
    precipSum: number[];
    precipProbMax: number[];
  };
};

function wmoToKey(code: number): string {
  if (code === 0) return "Clear Sky";
  if ([1, 2].includes(code)) return "Mainly Clear";
  if (code === 3) return "Partly Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55].includes(code)) return "Drizzle";
  if ([61, 63, 65].includes(code)) return "Rain";
  if ([80, 81, 82].includes(code)) return "Showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Partly Cloudy";
}

function windDirToDegreeStr(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8] || "N";
}

async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max&timezone=auto`;
  const wRes = await fetch(weatherUrl);
  if (!wRes.ok) throw new Error("Weather API request failed");
  const wData = await wRes.json();

  let locationName = `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
  try {
    const geoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const gRes = await fetch(geoUrl, { headers: { "User-Agent": "AnnadathaAI/1.0" } });
    if (gRes.ok) {
      const gData = await gRes.json();
      const addr = gData.address || {};
      const place = addr.village || addr.town || addr.city || addr.county || addr.district || "";
      const state = addr.state || addr.country || "";
      if (place) locationName = state ? `${place}, ${state}` : place;
    }
  } catch {
    // Reverse geocoding fallback
  }

  return {
    locationName,
    lat,
    lon,
    current: {
      temp: Math.round(wData.current.temperature_2m),
      feelsLike: Math.round(wData.current.apparent_temperature ?? wData.current.temperature_2m),
      humidity: wData.current.relative_humidity_2m,
      precipitation: wData.current.precipitation ?? 0,
      weatherCode: wData.current.weather_code ?? 0,
      windSpeed: Math.round(wData.current.wind_speed_10m ?? 0),
      windDirection: wData.current.wind_direction_10m ?? 0,
      pressure: Math.round(wData.current.surface_pressure ?? 1013),
    },
    daily: {
      time: wData.daily.time || [],
      weatherCode: wData.daily.weather_code || [],
      tempMax: wData.daily.temperature_2m_max || [],
      tempMin: wData.daily.temperature_2m_min || [],
      sunrise: wData.daily.sunrise || [],
      sunset: wData.daily.sunset || [],
      precipSum: wData.daily.precipitation_sum || [],
      precipProbMax: wData.daily.precipitation_probability_max || [],
    },
  };
}

async function fetchWeatherByCity(city: string): Promise<WeatherData> {
  const gRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`);
  if (!gRes.ok) throw new Error("City search failed");
  const gData = await gRes.json();
  const loc = gData.results?.[0];
  if (!loc) throw new Error("Location not found");
  const data = await fetchWeatherByCoords(loc.latitude, loc.longitude);
  return {
    ...data,
    locationName: `${loc.name}, ${loc.admin1 || loc.country || ""}`.replace(/,\s*$/, ""),
  };
}

function WeatherPage() {
  const t = useT();
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState(t("Getting your current location..."));
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchInput, setSearchInput] = useState("");

  function loadLocationWeather() {
    setLoading(true);
    setErrorMsg("");
    setPermissionDenied(false);
    setStatusMsg(t("Getting your current location..."));

    if (!navigator.geolocation) {
      setPermissionDenied(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setStatusMsg(t("Fetching weather information..."));
        try {
          const res = await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
          setData(res);
        } catch {
          setErrorMsg(t("Weather information is temporarily unavailable. Please try again later."));
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.warn("[Weather Geolocation Warning]", err.message);
        setPermissionDenied(true);
        setLoading(false);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }

  useEffect(() => {
    loadLocationWeather();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setLoading(true);
    setErrorMsg("");
    setStatusMsg(t("Fetching weather information..."));
    try {
      const res = await fetchWeatherByCity(searchInput.trim());
      setData(res);
      setPermissionDenied(false);
    } catch {
      setErrorMsg(t("Weather information is temporarily unavailable. Please try again later."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("weather")}
        subtitle={data ? `${t("Current Location")}: ${data.locationName}` : t("Live forecast for your area")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadLocationWeather}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Navigation className="h-4 w-4 text-primary" /> {t("Detect Location")}
            </button>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("Enter your city or location")}
                className="rounded-xl border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {t("Search")}
              </button>
            </form>
          </div>
        }
      />

      {loading && (
        <div className="card-soft flex items-center justify-center gap-3 p-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">{statusMsg}</span>
        </div>
      )}

      {permissionDenied && !data && !loading && (
        <div className="card-soft rounded-2xl border-amber-500/30 bg-amber-500/10 p-6 text-center">
          <MapPin className="mx-auto h-8 w-8 text-amber-600 dark:text-amber-400" />
          <h3 className="mt-2 text-lg font-semibold text-amber-800 dark:text-amber-300">
            {t("Location access is required to show weather for your current location.")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Please allow location access in your browser or search for your village/city above.
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="card-soft rounded-2xl border-destructive/30 bg-destructive/10 p-6 text-center text-destructive">
          <p className="font-semibold">{errorMsg}</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Main Weather Card */}
          <div className="card-soft relative overflow-hidden p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <MapPin className="h-3.5 w-3.5" /> {data.locationName}
                </div>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="font-display text-5xl font-bold tracking-tight sm:text-6xl">{data.current.temp}°C</span>
                  <span className="text-lg font-medium text-muted-foreground">
                    {t(wmoToKey(data.current.weatherCode))}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("Feels like")} {data.current.feelsLike}°C
                </p>
              </div>

              {/* Spraying / Farm advice hint */}
              <div className="rounded-2xl border bg-muted/40 p-4 text-sm max-w-xs">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Farming Conditions</div>
                <div className="mt-1 font-semibold text-foreground">
                  {data.current.humidity > 80 ? t("High fungal disease risk") : t("Normal")}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {data.current.windSpeed > 15 ? t("Avoid spraying") : t("OK for spraying")}
                </div>
              </div>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t("Temperature")}
              value={`${data.current.temp}°C`}
              hint={`${t("Feels like")} ${data.current.feelsLike}°C`}
              icon={<Thermometer className="h-4 w-4" />}
              tone="harvest"
            />
            <StatCard
              label={t("Humidity")}
              value={`${data.current.humidity}%`}
              hint={data.current.humidity > 80 ? t("High fungal disease risk") : t("Normal")}
              icon={<Droplets className="h-4 w-4" />}
              tone={data.current.humidity > 80 ? "warning" : "primary"}
            />
            <StatCard
              label={t("Rainfall now")}
              value={`${data.current.precipitation} mm`}
              icon={<CloudRain className="h-4 w-4" />}
              tone="success"
            />
            <StatCard
              label={t("Wind")}
              value={`${data.current.windSpeed} km/h ${windDirToDegreeStr(data.current.windDirection)}`}
              hint={data.current.windSpeed > 15 ? t("Avoid spraying") : t("OK for spraying")}
              icon={<Wind className="h-4 w-4" />}
              tone={data.current.windSpeed > 15 ? "warning" : "primary"}
            />
          </div>

          {/* Sun & Pressure Details */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-soft flex items-center gap-4 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Sunrise className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs text-muted-foreground">{t("Sunrise")}</div>
                <div className="mt-0.5 font-display text-lg font-semibold">
                  {data.daily.sunrise[0]
                    ? new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "06:00 AM"}
                </div>
              </div>
            </div>

            <div className="card-soft flex items-center gap-4 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400">
                <Sunset className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs text-muted-foreground">{t("Sunset")}</div>
                <div className="mt-0.5 font-display text-lg font-semibold">
                  {data.daily.sunset[0]
                    ? new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "06:30 PM"}
                </div>
              </div>
            </div>

            <div className="card-soft flex items-center gap-4 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <Gauge className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs text-muted-foreground">{t("Pressure")}</div>
                <div className="mt-0.5 font-display text-lg font-semibold">{data.current.pressure} hPa</div>
              </div>
            </div>
          </div>

          {/* 7-Day Forecast */}
          <div>
            <h2 className="mb-4 text-2xl font-semibold">{t("7-day forecast")}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {data.daily.time.map((dayStr: string, i: number) => (
                <div key={dayStr} className="card-soft p-4 text-center">
                  <div className="text-xs font-semibold text-muted-foreground">
                    {new Date(dayStr).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                  </div>
                  <div className="my-2 text-xs font-medium text-primary">
                    {t(wmoToKey(data.daily.weatherCode[i] ?? 0))}
                  </div>
                  <div className="font-display text-xl font-semibold">
                    {Math.round(data.daily.tempMax[i] ?? 0)}°
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(data.daily.tempMin[i] ?? 0)}° low
                  </div>
                  <div className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                    {data.daily.precipProbMax[i] ?? 0}% rain · {data.daily.precipSum[i] ?? 0} mm
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
