export const MOCK_USER = {
  name: "Arjun Mehta",
  phone: "+91 98765 43210",
  email: "arjun.m@example.com",
  joined: "Oct 2025"
};

export const MOCK_STATS = {
  totalScans: 24,
  callsReceived: 14,
  alertsReceived: 10,
  carsRegistered: 2,
};

export const MOCK_VEHICLES = [
  {
    id: "veh_1",
    car_number: "MH 01 AB 1234",
    make: "Maruti",
    model: "Baleno",
    color: "Nexa Blue",
    status: "Active",
    qr_id: "qr_alpha123"
  },
  {
    id: "veh_2",
    car_number: "KA 05 CD 5678",
    make: "Hyundai",
    model: "Creta",
    color: "Phantom Black",
    status: "Pending Delivery",
    qr_id: null
  }
];

export const MOCK_SCAN_HISTORY = [
  {
    id: "scan_101",
    date: "2025-11-12T10:30:00Z",
    location: "Mumbai",
    method: "alert",
    status: "resolved",
    car: "MH 01 AB 1234"
  },
  {
    id: "scan_102",
    date: "2025-11-10T14:45:00Z",
    location: "Pune",
    method: "call",
    status: "resolved",
    car: "MH 01 AB 1234"
  },
  {
    id: "scan_103",
    date: "2025-11-05T09:15:00Z",
    location: "Mumbai",
    method: "alert",
    status: "no_response",
    car: "MH 01 AB 1234"
  },
  {
    id: "scan_104",
    date: "2025-10-28T18:20:00Z",
    location: "Thane",
    method: "call",
    status: "resolved",
    car: "MH 01 AB 1234"
  },
  {
    id: "scan_105",
    date: "2025-10-15T12:00:00Z",
    location: "Mumbai",
    method: "alert",
    status: "resolved",
    car: "MH 01 AB 1234"
  }
];
