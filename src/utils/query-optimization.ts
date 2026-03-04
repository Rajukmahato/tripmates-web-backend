/**
 * Database Query Optimization Utilities
 * Helpers for efficient queries and caching
 */

import { Model, Document, Query } from 'mongoose';

/**
 * Optimized find query with population and lean
 * Lean() returns plain JS objects instead of Mongoose documents for better performance
 */
export async function findWithOptimization<T extends Document>(
    model: Model<T>,
    query: Record<string, any>,
    options?: {
        populate?: string | string[];
        select?: string;
        lean?: boolean;
        limit?: number;
        skip?: number;
        sort?: Record<string, 1 | -1>;
    }
): Promise<T[]> {
    let mongooseQuery: Query<any, T> = model.find(query);

    // Apply select (choose specific fields)
    if (options?.select) {
        mongooseQuery = mongooseQuery.select(options.select);
    }

    // Apply populate (join references)
    if (options?.populate) {
        if (Array.isArray(options.populate)) {
            options.populate.forEach(p => {
                mongooseQuery = mongooseQuery.populate(p);
            });
        } else {
            mongooseQuery = mongooseQuery.populate(options.populate);
        }
    }

    // Apply sorting
    if (options?.sort) {
        mongooseQuery = mongooseQuery.sort(options.sort);
    }

    // Apply pagination
    if (options?.skip) {
        mongooseQuery = mongooseQuery.skip(options.skip);
    }
    if (options?.limit) {
        mongooseQuery = mongooseQuery.limit(options.limit);
    }

    // Lean for better performance (returns plain JS instead of Mongoose documents)
    if (options?.lean !== false) {
        mongooseQuery = mongooseQuery.lean();
    }

    return mongooseQuery.exec();
}

/**
 * Batch insert with error handling
 * More efficient than individual inserts
 */
export async function batchInsert<T extends Document>(
    model: Model<T>,
    documents: Partial<T>[],
    options?: {
        batchSize?: number;
        ordered?: boolean;
    }
) {
    const batchSize = options?.batchSize || 1000;
    const ordered = options?.ordered !== false;

    try {
        const results = [];
        for (let i = 0; i < documents.length; i += batchSize) {
            const batch = documents.slice(i, i + batchSize);
            const result = await model.insertMany(batch, { ordered });
            results.push(result);
        }
        return results;
    } catch (error) {
        console.error('Batch insert error:', error);
        throw error;
    }
}

/**
 * Efficient bulk update operations
 */
export async function bulkUpdate<T extends Document>(
    model: Model<T>,
    updates: Array<{
        filter: Record<string, any>;
        update: Partial<T>;
    }>
) {
    try {
        const bulk = model.collection.initializeUnorderedBulkOp();

        updates.forEach(({ filter, update }) => {
            bulk.find(filter).updateOne({ $set: update });
        });

        return await bulk.execute();
    } catch (error) {
        console.error('Bulk update error:', error);
        throw error;
    }
}

/**
 * Efficient aggregation pipeline for complex queries
 * Uses MongoDB aggregation framework
 */
export async function aggregateOptimized<T extends Document>(
    model: Model<T>,
    pipeline: any[]
) {
    try {
        // Add $limit stage early if possible to reduce data processed
        const optimizedPipeline = [
            ...pipeline,
            // Note: Add indexes on frequently used aggregate fields in schema
        ];

        return await model.aggregate(optimizedPipeline).exec();
    } catch (error) {
        console.error('Aggregation error:', error);
        throw error;
    }
}

/**
 * Count with query for efficient counting
 */
export async function countEfficient<T extends Document>(
    model: Model<T>,
    query: Record<string, any>
): Promise<number> {
    try {
        // countDocuments is more efficient than find().count()
        return await model.countDocuments(query);
    } catch (error) {
        console.error('Count error:', error);
        throw error;
    }
}

/**
 * Pagination helper with count
 */
export async function paginate<T extends Document>(
    model: Model<T>,
    query: Record<string, any>,
    page: number,
    limit: number,
    options?: {
        populate?: string | string[];
        select?: string;
        sort?: Record<string, 1 | -1>;
    }
) {
    try {
        const skip = (page - 1) * limit;

        const [documents, total] = await Promise.all([
            findWithOptimization(model, query, {
                ...options,
                skip,
                limit,
                lean: true,
            }),
            countEfficient(model, query),
        ]);

        const pages = Math.ceil(total / limit);

        return {
            data: documents,
            pagination: {
                page,
                limit,
                total,
                pages,
                hasMore: page < pages,
            },
        };
    } catch (error) {
        console.error('Pagination error:', error);
        throw error;
    }
}

/**
 * Index optimization recommendations
 * Call this in development to check missing indexes
 */
export async function checkIndexMatches<T extends Document>(
    model: Model<T>,
    recommendedIndexes: Array<{
        fields: Record<string, 1 | -1>;
        name?: string;
        unique?: boolean;
    }>
) {
    try {
        const existingIndexes = await model.collection.getIndexes();
        const missing = [];

        for (const recommended of recommendedIndexes) {
            const key = JSON.stringify(recommended.fields);
            const exists = Object.values(existingIndexes).some(
                (index: any) => JSON.stringify((index as any).key) === key
            );

            if (!exists) {
                missing.push(recommended);
            }
        }

        if (missing.length > 0) {
            console.warn(`⚠️ Missing indexes for ${model.modelName}:`, missing);
        }

        return missing;
    } catch (error) {
        console.error('Index check error:', error);
        return [];
    }
}

/**
 * Query execution time monitoring
 */
export function monitorQueryTime(modelName: string, operation: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const startTime = Date.now();
            try {
                const result = await originalMethod.apply(this, args);
                const duration = Date.now() - startTime;

                if (duration > 1000) {
                    console.warn(
                        `🐌 SLOW QUERY: ${modelName}.${operation} took ${duration}ms`
                    );
                }

                return result;
            } catch (error) {
                const duration = Date.now() - startTime;
                console.error(
                    `❌ FAILED QUERY: ${modelName}.${operation} failed after ${duration}ms`,
                    error
                );
                throw error;
            }
        };

        return descriptor;
    };
}
