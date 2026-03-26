import { Resend } from "resend";
import { z } from "zod";
import { ChatbotError } from "@/lib/errors";

const resend = new Resend(process.env.RESEND_API_KEY);

const shareRequestSchema = z.object({
  imageUrl: z.string().url(),
  customerName: z.string().min(1).max(100).optional(),
  customerEmail: z.string().email().optional(),
  notes: z.string().max(500).optional(),
  style: z.string().max(100).optional(),
  bodyPart: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = shareRequestSchema.parse(json);

    const artistEmail =
      process.env.TATTOO_ARTIST_EMAIL || "tech@lienzzo.com";

    // Fetch the image to attach it
    let imageAttachment: { filename: string; content: Buffer } | undefined;
    try {
      const imageResponse = await fetch(body.imageUrl);
      if (imageResponse.ok) {
        const arrayBuffer = await imageResponse.arrayBuffer();
        imageAttachment = {
          filename: "tattoo-design.png",
          content: Buffer.from(arrayBuffer),
        };
      }
    } catch {
      // If we can't fetch the image, we'll include the URL in the email body
    }

    const { data, error } = await resend.emails.send({
      from: "TatooIA <onboarding@resend.dev>",
      to: [artistEmail],
      subject: `Nuevo diseño de tatuaje${body.customerName ? ` - ${body.customerName}` : ""}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px;">
            TatooIA - Nuevo Diseño
          </h1>

          <p style="color: #444; font-size: 16px;">
            Un cliente ha compartido un diseño de tatuaje generado con TatooIA.
          </p>

          ${body.customerName ? `<p><strong>Cliente:</strong> ${body.customerName}</p>` : ""}
          ${body.customerEmail ? `<p><strong>Email de contacto:</strong> ${body.customerEmail}</p>` : ""}
          ${body.style ? `<p><strong>Estilo:</strong> ${body.style}</p>` : ""}
          ${body.bodyPart ? `<p><strong>Zona del cuerpo:</strong> ${body.bodyPart}</p>` : ""}
          ${body.notes ? `<p><strong>Notas adicionales:</strong> ${body.notes}</p>` : ""}

          <div style="margin: 20px 0; text-align: center;">
            <img src="${body.imageUrl}" alt="Diseño de tatuaje" style="max-width: 100%; border-radius: 8px; border: 1px solid #e5e5e5;" />
          </div>

          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;" />
          <p style="color: #888; font-size: 12px; text-align: center;">
            Generado con TatooIA - Preview de Tatuajes con IA
          </p>
        </div>
      `,
      ...(imageAttachment
        ? {
            attachments: [imageAttachment],
          }
        : {}),
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json(
        { error: "Error al enviar el email" },
        { status: 500 }
      );
    }

    return Response.json({ success: true, id: data?.id });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Share email error:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
