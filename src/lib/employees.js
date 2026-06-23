// Only employees holding an "attendant"/"service provider" position can be
// assigned to provide booking services — other positions (e.g. manager,
// receptionist) shouldn't show up in staff/team pickers.
export const ATTENDANT_POSITIONS = ['attendant', 'attendants', 'service provider', 'service providers'];

export const isAttendantPosition = (position) => ATTENDANT_POSITIONS.includes(position?.trim().toLowerCase());
