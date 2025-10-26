export enum UserRole {
  REQUESTER = 'requester',
  MARSHAL = 'marshal',
}

export enum TaskStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

export enum PaymentMethod {
  PREPAID = 'Pre-Paid',
  ON_THE_SPOT = 'On the Spot',
}

export interface User {
  id: string;
  name: string;
  surname: string;
  cellphone: string;
  email: string;
  idNumber: string;
  role: UserRole;
  location?: { lat: number; lng: number };
  idDocumentUrl?: string;
  bankDetailsUrl?: string;
  balance: number;
  averageRating?: number;
  ratingCount?: number;
}

export interface Task {
  id: string;
  requesterId: string;
  marshalId?: string;
  title: string;
  description:string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  fee: number;
  duration: number; // in hours
  createdAt: number; // timestamp
  status: TaskStatus;
  paymentMethod: PaymentMethod;
  requesterRated?: boolean;
  marshalRated?: boolean;
}

export interface ChatMessage {
    id: string;
    taskId: string;
    senderId: string;
    text: string;
    timestamp: number;
}

export interface Rating {
    id: string;
    taskId: string;
    ratedUserId: string;
    ratedByUserId: string;
    rating: number; // 1-5
    comment?: string;
    createdAt: number;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (userData: Omit<User, 'id' | 'balance'> & { password?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
}

export interface TaskContextType {
  tasks: Task[];
  openTasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'requesterId' | 'paymentMethod'>, paymentMethod: PaymentMethod) => Promise<Task>;
  acceptTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addRating: (taskId: string, ratedUserId: string, rating: number, comment?: string) => Promise<void>;
  getTasksByRequester: (requesterId: string) => Task[];
  getTasksByMarshal: (marshalId: string) => Task[];
}