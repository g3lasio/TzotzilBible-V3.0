import timelineData from '../../assets/timeline_data/biblical_timeline.json';
import { TimelineEvent, Era, FilterOptions, TimelineData } from '../types/timeline';

class TimelineService {
  private static data: TimelineData = timelineData as TimelineData;
  private static erasCache: Era[] | null = null;

  /**
   * Get all eras with their events grouped
   */
  static getEras(): Era[] {
    if (this.erasCache) {
      return this.erasCache;
    }

    const eraMap = new Map<string, TimelineEvent[]>();

    // Group events by era
    this.data.events.forEach(event => {
      if (!eraMap.has(event.era)) {
        eraMap.set(event.era, []);
      }
      eraMap.get(event.era)!.push(event);
    });

    // Convert to Era objects
    this.erasCache = Array.from(eraMap.entries()).map(([eraName, events]) => {
      // Determine testament based on first event
      const testament = events[0]?.testament || 'OT';
      
      // Calculate year range
      const years = events
        .map(e => e.yearBC || e.yearAD || 0)
        .filter(y => y !== 0);
      
      const startYear = years.length > 0 ? Math.max(...years) : null;
      const endYear = years.length > 0 ? Math.min(...years) : null;

      return {
        name: eraName,
        testament,
        startYear,
        endYear,
        eventCount: events.length,
        events: events.sort((a, b) => {
          // Sort by year (descending for BC, ascending for AD)
          const yearA = a.yearBC || -a.yearAD! || 0;
          const yearB = b.yearBC || -b.yearAD! || 0;
          return yearB - yearA;
        })
      };
    });

    // Sort eras chronologically
    this.erasCache.sort((a, b) => {
      const yearA = a.startYear || 0;
      const yearB = b.startYear || 0;
      return yearB - yearA;
    });

    return this.erasCache;
  }

  /**
   * Get events by era name
   */
  static getEventsByEra(eraName: string): TimelineEvent[] {
    const era = this.getEras().find(e => e.name === eraName);
    return era?.events || [];
  }

  /**
   * Get events by testament
   */
  static getEventsByTestament(testament: 'OT' | 'NT'): TimelineEvent[] {
    return this.data.events.filter(event => event.testament === testament);
  }

  /**
   * Get all events
   */
  static getAllEvents(): TimelineEvent[] {
    return this.data.events;
  }

  /**
   * Get event by ID
   */
  static getEventById(id: string): TimelineEvent | null {
    return this.data.events.find(event => event.id === id) || null;
  }

  /**
   * Search events by query
   */
  static searchEvents(query: string): TimelineEvent[] {
    if (!query || query.trim() === '') {
      return [];
    }

    const lowerQuery = query.toLowerCase().trim();

    return this.data.events.filter(event => {
      return (
        event.event.toLowerCase().includes(lowerQuery) ||
        event.description.toLowerCase().includes(lowerQuery) ||
        event.keyPersons.some(person => person.toLowerCase().includes(lowerQuery)) ||
        event.location.toLowerCase().includes(lowerQuery) ||
        event.era.toLowerCase().includes(lowerQuery)
      );
    });
  }

  /**
   * Filter events by multiple criteria
   */
  static filterEvents(filters: FilterOptions): TimelineEvent[] {
    let filtered = this.data.events;

    // Filter by testament
    if (filters.testament && filters.testament !== 'ALL') {
      filtered = filtered.filter(event => event.testament === filters.testament);
    }

    // Filter by era
    if (filters.era) {
      filtered = filtered.filter(event => event.era === filters.era);
    }

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(event => event.category === filters.category);
    }

    // Filter by person
    if (filters.person) {
      filtered = filtered.filter(event =>
        event.keyPersons.some(p => p.toLowerCase().includes(filters.person!.toLowerCase()))
      );
    }

    // Filter by location
    if (filters.location) {
      filtered = filtered.filter(event =>
        event.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    // Filter by search query
    if (filters.searchQuery) {
      const lowerQuery = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(event =>
        event.event.toLowerCase().includes(lowerQuery) ||
        event.description.toLowerCase().includes(lowerQuery) ||
        event.keyPersons.some(person => person.toLowerCase().includes(lowerQuery))
      );
    }

    return filtered;
  }

  /**
   * Get all unique categories
   */
  static getCategories(): string[] {
    const categories = new Set(this.data.events.map(e => e.category));
    return Array.from(categories).sort();
  }

  /**
   * Get all unique persons
   */
  static getPersons(): string[] {
    const persons = new Set<string>();
    this.data.events.forEach(event => {
      event.keyPersons.forEach(person => persons.add(person));
    });
    return Array.from(persons).sort();
  }

  /**
   * Get all unique locations
   */
  static getLocations(): string[] {
    const locations = new Set(this.data.events.map(e => e.location).filter(l => l));
    return Array.from(locations).sort();
  }

  /**
   * Get metadata
   */
  static getMetadata() {
    return this.data.metadata;
  }

  /**
   * Get related events (same era or same key persons)
   */
  static getRelatedEvents(eventId: string, limit: number = 5): TimelineEvent[] {
    const event = this.getEventById(eventId);
    if (!event) return [];

    const related = this.data.events.filter(e => {
      if (e.id === eventId) return false;
      
      // Same era
      if (e.era === event.era) return true;
      
      // Shares key persons
      const sharedPersons = e.keyPersons.filter(p => event.keyPersons.includes(p));
      if (sharedPersons.length > 0) return true;
      
      return false;
    });

    return related.slice(0, limit);
  }
}

export default TimelineService;
