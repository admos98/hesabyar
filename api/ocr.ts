// /api/ocr.ts
// Vercel Serverless Function for receipt OCR processing using Google Gemini API

import { Buffer } from "buffer";
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const { API_KEY } = process.env;

const ai = new GoogleGenAI({ apiKey: API_KEY! });

async function fileToGenerativePart(buffer: Buffer, mimeType: string) {
    return {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType,
      },
    };
}

// Main API handler - Vercel default export format  
export default async function handler(request: any) {
    if (!API_KEY) {
        return new Response(JSON.stringify({ error: "API key not configured." }), { status: 500 });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    try {
        const contentType = request.headers['content-type'] || '';
        
        if (!contentType.includes('multipart/form-data')) {
            return new Response(JSON.stringify({ error: "Content-Type must be multipart/form-data" }), { status: 400 });
        }

        // Parse multipart form data manually from buffer
        const chunks: any[] = [];
        const reader = request.body.getReader ? request.body.getReader() : null;
        
        let bodyBuffer: Buffer;
        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }
            bodyBuffer = Buffer.concat(chunks);
        } else {
            bodyBuffer = Buffer.isBuffer(request.body) ? request.body : Buffer.from(request.body);
        }

        // Extract boundary from content-type
        const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
        if (!boundaryMatch) {
            return new Response(JSON.stringify({ error: "Invalid multipart format" }), { status: 400 });
        }

        const boundary = boundaryMatch[1].replace(/"/g, '');
        const parts = bodyBuffer.toString('binary').split('--' + boundary);
        
        let fileBuffer: Buffer | null = null;
        let fileMimeType = 'image/jpeg';

        for (const part of parts) {
            if (part.includes('filename=')) {
                const mimeMatch = part.match(/Content-Type:\s*([^\r\n]+)/);
                if (mimeMatch) {
                    fileMimeType = mimeMatch[1].trim();
                }
                
                const headerEnd = part.indexOf('\r\n\r\n');
                if (headerEnd !== -1) {
                    const contentStart = headerEnd + 4;
                    const contentEnd = part.lastIndexOf('\r\n');
                    const content = part.substring(contentStart, contentEnd);
                    fileBuffer = Buffer.from(content, 'binary');
                    break;
                }
            }
        }

        if (!fileBuffer) {
            return new Response(JSON.stringify({ error: "No file uploaded." }), { status: 400 });
        }

        const imagePart = await fileToGenerativePart(fileBuffer, fileMimeType);

        const prompt = `
          شما یک دستیار هوشمند برای تحلیل فاکتورهای خرید هستید. لطفا اطلاعات زیر را از تصویر فاکتور استخراج کرده و در قالب یک ساختار JSON دقیق بازگردانید.
          - نام فروشنده (vendorName)
          - تاریخ فاکتور (date) به فرمت YYYY-MM-DD
          - لیستی از اقلام خریداری شده (items) که هر قلم شامل موارد زیر باشد:
            - نام کالا (name)
            - تعداد (quantity) به صورت عدد
            - قیمت واحد (unitPrice) به صورت عدد
            - قیمت کل (totalPrice) به صورت عدد

          فقط و فقط ساختار JSON را بدون هیچ متن اضافی یا توضیحی بازگردانید. اگر اطلاعاتی موجود نیست، مقدار null قرار دهید.
        `;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                vendorName: { type: Type.STRING, description: "نام فروشگاه یا فروشنده" },
                date: { type: Type.STRING, description: "تاریخ فاکتور به فرمت YYYA-MM-DD" },
                items: {
                    type: Type.ARRAY,
                    description: "لیست اقلام خریداری شده",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "نام کالا" },
                            quantity: { type: Type.NUMBER, description: "تعداد یا مقدار کالا" },
                            unitPrice: { type: Type.NUMBER, description: "قیمت واحد کالا" },
                            totalPrice: { type: Type.NUMBER, description: "قیمت کل برای آن کالا" }
                        },
                        required: ["name", "quantity", "totalPrice"]
                    }
                }
            },
            required: ["vendorName", "date", "items"]
        };

        const aiResponse: GenerateContentResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [imagePart, { text: prompt }] },
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
          },
        });

        const jsonText = aiResponse.text.trim();
        const data = JSON.parse(jsonText);
        return new Response(JSON.stringify(data), { status: 200 });

    } catch (error: any) {
        console.error("Error processing receipt with Gemini:", error);
        return new Response(JSON.stringify({ error: "پردازش تصویر فاکتور با خطا مواجه شد." }), { status: 500 });
    }
}
