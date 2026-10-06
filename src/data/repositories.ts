import { IRepository } from './interfaces/IRepository';
import { AsyncStorageRepository } from './local/AsyncStorageRepo';

/**
 * Repository factory / dependency injection entry point.
 *
 * To migrate to a cloud backend, create a new class
 * (e.g., FirebaseRepository) that implements IRepository,
 * and change this factory to return it instead.
 */

let repository: IRepository | null = null;

export function getRepository(): IRepository {
  if (!repository) {
    repository = new AsyncStorageRepository();
  }
  return repository;
}

// For testing: allows injection of a mock repository
export function setRepository(repo: IRepository): void {
  repository = repo;
}

export type { IRepository } from './interfaces/IRepository';
