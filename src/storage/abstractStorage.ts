abstract class AbstractStorage {
    abstract get<T>(key: string, defaultValue: T): Promise<T>;

    abstract set(data: Record<string, unknown>): Promise<void>;
}

export default AbstractStorage;
