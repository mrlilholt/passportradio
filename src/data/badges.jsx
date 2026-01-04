import { 
    Globe, MapPin, Flag,            // Exploration
    Radio, Signal, RadioTower, Zap, Crown, // Scouting Ranks (Fixed: Broadcast -> RadioTower)
    Headphones, Music,              // General Audio
    Trophy, Compass, Map,           // Trivia
    Moon, Sunrise, Calendar         // Time/Special (Fixed: Sun -> Sunrise if needed)
} from 'lucide-react';

export const BADGES = [
    // ==========================================
    // 1. SCOUTING RANKS (Listening Time)
    // Used by QuestWidget to show "Next Rank"
    // ==========================================
    {
        id: 'scout_rank_1',
        label: 'Signal Rookie',
        description: 'Listen for 5 minutes total',
        xpReward: 100,
        icon: Radio,
        type: 'scout_rank', 
        condition: (stats) => (stats.totalMinutes || 0) >= 5
    },
    {
        id: 'scout_rank_2',
        label: 'Frequency Finder',
        description: 'Listen for 30 minutes total',
        xpReward: 250,
        icon: Signal,
        type: 'scout_rank',
        condition: (stats) => (stats.totalMinutes || 0) >= 30
    },
    {
        id: 'scout_rank_3',
        label: 'Broadcast Hunter',
        description: 'Listen for 1 hour total',
        xpReward: 500,
        icon: RadioTower, // 👈 FIXED HERE
        type: 'scout_rank',
        condition: (stats) => (stats.totalMinutes || 0) >= 60
    },
    {
        id: 'scout_rank_4',
        label: 'Wave Master',
        description: 'Listen for 5 hours total',
        xpReward: 1000,
        icon: Zap,
        type: 'scout_rank',
        condition: (stats) => (stats.totalMinutes || 0) >= 300
    },
    {
        id: 'scout_rank_5',
        label: 'Radio Legend',
        description: 'Listen for 24 hours total',
        xpReward: 5000,
        icon: Crown,
        type: 'scout_rank',
        condition: (stats) => (stats.totalMinutes || 0) >= 1440
    },

    // ==========================================
    // 2. EXPLORATION (Countries Visited)
    // ==========================================
    {
        id: 'explorer_novice',
        label: 'Tourist',
        description: 'Visit 5 different countries',
        xpReward: 150,
        icon: Globe,
        condition: (stats) => (stats.uniqueCountries || []).length >= 5
    },
    {
        id: 'explorer_pro',
        label: 'Nomad',
        description: 'Visit 20 different countries',
        xpReward: 600,
        icon: MapPin,
        condition: (stats) => (stats.uniqueCountries || []).length >= 20
    },
    {
        id: 'explorer_elite',
        label: 'Ambassador',
        description: 'Visit 50 different countries',
        xpReward: 1500,
        icon: Flag,
        condition: (stats) => (stats.uniqueCountries || []).length >= 50
    },

    // ==========================================
    // 3. TRIVIA (Skill & Knowledge)
    // ==========================================
    {
        id: 'trivia_novice',
        label: 'Smarty',
        description: 'Win 5 Trivia rounds',
        xpReward: 200,
        icon: Compass,
        condition: (stats) => (stats.triviaWins || 0) >= 5
    },
    {
        id: 'trivia_expert',
        label: 'Geographer',
        description: 'Win 25 Trivia rounds',
        xpReward: 500,
        icon: Map,
        condition: (stats) => (stats.triviaWins || 0) >= 25
    },
    {
        id: 'trivia_master',
        label: 'Cartographer',
        description: 'Win 50 Trivia rounds',
        xpReward: 1200,
        icon: Trophy,
        condition: (stats) => (stats.triviaWins || 0) >= 50
    },

    // ==========================================
    // 4. STATION HOPPING (Variety)
    // ==========================================
    {
        id: 'surfer',
        label: 'Channel Surfer',
        description: 'Visit 50 unique stations',
        xpReward: 300,
        icon: Headphones,
        condition: (stats) => (stats.uniqueStations || []).length >= 50
    },
    {
        id: 'dj',
        label: 'Disc Jockey',
        description: 'Visit 100 unique stations',
        xpReward: 800,
        icon: Music,
        condition: (stats) => (stats.uniqueStations || []).length >= 100
    },

    // ==========================================
    // 5. SPECIAL / SECRET (Time & Context)
    // ==========================================
    {
        id: 'night_owl',
        label: 'Night Owl',
        description: 'Tune in between 1 AM and 4 AM',
        xpReward: 150,
        icon: Moon,
        condition: (stats, context) => context?.isNight === true 
    },
    {
        id: 'early_bird',
        label: 'Early Bird',
        description: 'Tune in between 5 AM and 8 AM',
        xpReward: 150,
        icon: Sunrise,
        condition: (stats, context) => context?.isMorning === true
    },
    {
        id: 'weekend_warrior',
        label: 'Weekend Warrior',
        description: 'Tune in on a Saturday or Sunday',
        xpReward: 100,
        icon: Calendar,
        condition: (stats) => {
            const day = new Date().getDay();
            return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
        }
    }
];

export const getNextLevelXP = (level) => Math.floor(1000 * Math.pow(1.2, level - 1));