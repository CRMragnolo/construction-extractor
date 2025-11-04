const exifr = require('exifr');
const axios = require('axios');

/**
 * ExifService - Estrazione metadati EXIF da foto (GPS, data, dispositivo)
 * Reverse geocoding per ottenere indirizzo da coordinate
 */
class ExifService {
  constructor() {
    // Usa Nominatim (OpenStreetMap) per reverse geocoding gratuito
    this.geocodingUrl = 'https://nominatim.openstreetmap.org/reverse';
  }

  /**
   * Estrae tutti i metadati EXIF dalla foto
   * @param {string} imagePath - Path assoluto all'immagine
   * @returns {Promise<Object>} Metadati estratti
   */
  async extractMetadata(imagePath) {
    try {
      const exif = await exifr.parse(imagePath, {
        gps: true,
        pick: ['latitude', 'longitude', 'DateTimeOriginal', 'Make', 'Model', 'GPSAltitude']
      });

      if (!exif) {
        return {
          has_metadata: false,
          message: 'Nessun metadato EXIF trovato'
        };
      }

      const metadata = {
        has_metadata: true,
        gps: null,
        location: null,
        datetime: null,
        device: null
      };

      // GPS Coordinates
      if (exif.latitude && exif.longitude) {
        metadata.gps = {
          latitude: exif.latitude,
          longitude: exif.longitude,
          altitude: exif.GPSAltitude || null,
          coordinates_string: `${exif.latitude}, ${exif.longitude}`
        };

        // Reverse geocoding per ottenere indirizzo
        try {
          const location = await this.reverseGeocode(exif.latitude, exif.longitude);
          metadata.location = location;
        } catch (geocodeError) {
          console.warn('Errore reverse geocoding:', geocodeError.message);
        }
      }

      // Data e ora scatto
      if (exif.DateTimeOriginal) {
        metadata.datetime = {
          original: exif.DateTimeOriginal,
          iso: exif.DateTimeOriginal.toISOString(),
          formatted: exif.DateTimeOriginal.toLocaleString('it-IT')
        };
      }

      // Dispositivo
      if (exif.Make || exif.Model) {
        metadata.device = {
          make: exif.Make || null,
          model: exif.Model || null,
          full_name: [exif.Make, exif.Model].filter(Boolean).join(' ')
        };
      }

      return metadata;

    } catch (error) {
      console.error('Errore estrazione EXIF:', error.message);
      return {
        has_metadata: false,
        error: error.message
      };
    }
  }

  /**
   * Reverse geocoding: converte coordinate GPS in indirizzo
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<Object>} Indirizzo trovato
   */
  async reverseGeocode(latitude, longitude) {
    try {
      const response = await axios.get(this.geocodingUrl, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
          zoom: 18, // Massimo dettaglio
          'accept-language': 'it'
        },
        headers: {
          'User-Agent': 'ConstructionSiteExtractor/1.0' // Richiesto da Nominatim
        }
      });

      const data = response.data;
      const addr = data.address || {};

      return {
        display_name: data.display_name,
        address: {
          road: addr.road || null,
          house_number: addr.house_number || null,
          postcode: addr.postcode || null,
          city: addr.city || addr.town || addr.village || addr.municipality || null,
          province: addr.province || addr.county || null,
          region: addr.state || addr.region || null,
          country: addr.country || null
        },
        formatted_address: this.formatItalianAddress(addr),
        osm_id: data.osm_id,
        osm_type: data.osm_type
      };

    } catch (error) {
      console.error('Errore reverse geocoding:', error.message);
      throw new Error('Impossibile ottenere indirizzo da coordinate');
    }
  }

  /**
   * Formatta indirizzo in stile italiano
   */
  formatItalianAddress(addr) {
    const parts = [];

    // Via e numero civico
    if (addr.road) {
      parts.push(addr.road);
      if (addr.house_number) {
        parts[0] += `, ${addr.house_number}`;
      }
    }

    // CAP e Città
    const cityParts = [];
    if (addr.postcode) cityParts.push(addr.postcode);
    if (addr.city || addr.town || addr.village || addr.municipality) {
      cityParts.push(addr.city || addr.town || addr.village || addr.municipality);
    }
    if (cityParts.length > 0) {
      parts.push(cityParts.join(' '));
    }

    // Provincia
    if (addr.province || addr.county) {
      parts.push(`(${addr.province || addr.county})`);
    }

    return parts.join(', ');
  }

  /**
   * Calcola distanza tra due punti GPS (in metri)
   * Usa formula Haversine
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Raggio Terra in metri
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distanza in metri
  }
}

module.exports = ExifService;
