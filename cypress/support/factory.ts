import type { TestUser, Chat } from './types'

import { faker } from '@faker-js/faker'

export function createNewUser(): TestUser {
  return {
    email: faker.internet.email(),
    username: faker.internet.userName(),
    password: faker.internet.password(),
  }
}
export function createChat(): Chat {
  return {
    name: faker.lorem.words(1),
  }
}
