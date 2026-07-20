var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const prisma = new PrismaClient();
// Expects a JSON file with an array of problems: 
// [ { title, description, difficulty, testCases: [{input, output}], hiddenTestCases: [{input, output}] }, ... ]
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        const dataPath = process.argv[2];
        if (!dataPath) {
            console.error('Please provide a path to the JSON problems file.');
            process.exit(1);
        }
        const absolutePath = path.resolve(dataPath);
        const rawData = fs.readFileSync(absolutePath, 'utf-8');
        const problems = JSON.parse(rawData);
        console.log(`Seeding ${problems.length} problems...`);
        for (const p of problems) {
            try {
                yield prisma.question.upsert({
                    where: { title: p.title },
                    update: {
                        description: p.description,
                        difficulty: p.difficulty || 'Medium',
                        restrictions: p.restrictions || '',
                        inputFormat: p.inputFormat || '',
                        outputFormat: p.outputFormat || '',
                        idealComplexity: p.idealComplexity || '',
                        testCases: JSON.stringify(p.testCases || []),
                        hiddenTestCases: JSON.stringify(p.hiddenTestCases || []),
                        brokenCode: p.brokenCode ? (typeof p.brokenCode === 'object' ? JSON.stringify(p.brokenCode) : p.brokenCode) : null,
                    },
                    create: {
                        title: p.title,
                        description: p.description,
                        difficulty: p.difficulty || 'Medium',
                        restrictions: p.restrictions || '',
                        inputFormat: p.inputFormat || '',
                        outputFormat: p.outputFormat || '',
                        idealComplexity: p.idealComplexity || '',
                        testCases: JSON.stringify(p.testCases || []),
                        hiddenTestCases: JSON.stringify(p.hiddenTestCases || []),
                        brokenCode: p.brokenCode ? (typeof p.brokenCode === 'object' ? JSON.stringify(p.brokenCode) : p.brokenCode) : null,
                    },
                });
                console.log(`Upserted: ${p.title}`);
            }
            catch (e) {
                console.error(`Failed to upsert ${p.title}:`, e);
            }
        }
        yield prisma.$disconnect();
        console.log('Seeding complete.');
    });
}
seed();
