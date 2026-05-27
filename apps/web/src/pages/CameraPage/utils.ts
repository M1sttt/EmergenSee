import { User } from '@emergensee/shared';
import { getEntityId } from '@/types/entities';

export function findUserByIdentity(users: User[], identity: string): User | undefined {
	return users.find(u => getEntityId(u) === identity);
}
