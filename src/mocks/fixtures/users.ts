import type { User } from "@/contracts/auth";

type MockUser = User & {
  password: string;
};

export const users: MockUser[] = [
  {
    id: "user-collector",
    name: "Mock Collector",
    email: "collector@kurio.test",
    password: "123456",
  },
  {
    id: "user-creator",
    name: "Mock Creator",
    email: "creator@kurio.test",
    password: "123456",
  },
];
