import { prisma } from "./db";

export type NotificationChannel = "EMAIL" | "SMS" | "WHATSAPP";

export interface SendNotificationOptions {
  recipientId?: string;
  email?: string;
  mobile?: string;
  channel: NotificationChannel;
  event: "APPOINTMENT_CONFIRM" | "REMINDER_24H" | "REMINDER_2H" | "FOLLOW_UP" | "PRESCRIPTION_READY";
  variables: Record<string, string>;
}

// Interface for pluggable channels
interface NotificationProvider {
  send(to: string, message: string): Promise<boolean>;
}

// Mock providers for local demo
const mockEmailProvider: NotificationProvider = {
  async send(to: string, message: string) {
    console.log(`[MOCK EMAIL SENT TO ${to}]: ${message}`);
    return true;
  },
};

const mockSMSProvider: NotificationProvider = {
  async send(to: string, message: string) {
    console.log(`[MOCK SMS SENT TO ${to}]: ${message}`);
    return true;
  },
};

const mockWhatsAppProvider: NotificationProvider = {
  async send(to: string, message: string) {
    console.log(`[MOCK WHATSAPP SENT TO ${to}]: ${message}`);
    return true;
  },
};

// Notification Service implementation
class NotificationService {
  private emailProvider: NotificationProvider = mockEmailProvider;
  private smsProvider: NotificationProvider = mockSMSProvider;
  private whatsappProvider: NotificationProvider = mockWhatsAppProvider;

  // Allows injecting third-party providers in future
  public configureProviders(options: {
    email?: NotificationProvider;
    sms?: NotificationProvider;
    whatsapp?: NotificationProvider;
  }) {
    if (options.email) this.emailProvider = options.email;
    if (options.sms) this.smsProvider = options.sms;
    if (options.whatsapp) this.whatsappProvider = options.whatsapp;
  }

  private getTemplate(event: string, vars: Record<string, string>): string {
    switch (event) {
      case "APPOINTMENT_CONFIRM":
        return `Hello ${vars.patientName}, your appointment with ${vars.doctorName} on ${vars.dateTime} is confirmed. Token: ${vars.queueNumber || "N/A"}.`;
      case "REMINDER_24H":
        return `Reminder: Your appointment with ${vars.doctorName} is tomorrow at ${vars.dateTime}. Please arrive 10 minutes early.`;
      case "REMINDER_2H":
        return `Quick Reminder: Your appointment with ${vars.doctorName} is in 2 hours at ${vars.dateTime}. See you soon!`;
      case "FOLLOW_UP":
        return `Hello ${vars.patientName}, Dr. ${vars.doctorName} recommended a follow-up visit. Tentative date suggested is ${vars.followUpDate}. Please book your slot.`;
      case "PRESCRIPTION_READY":
        return `Hello ${vars.patientName}, your prescription from Dr. ${vars.doctorName} is ready and has been shared to your portal.`;
      default:
        return `Notification from Skin & Hair Clinic. Details: ${JSON.stringify(vars)}`;
    }
  }

  public async sendNotification(options: SendNotificationOptions): Promise<boolean> {
    const message = this.getTemplate(options.event, options.variables);
    const to = options.channel === "EMAIL" ? options.email : options.mobile;

    if (!to) {
      console.warn(`[Notification] Skip sending, recipient address not found for channel ${options.channel}`);
      return false;
    }

    // Save status to db
    const dbNotif = await prisma.notification.create({
      data: {
        recipientId: options.recipientId || null,
        email: options.email || null,
        channel: options.channel,
        templateEvent: options.event,
        message,
        status: "PENDING",
      },
    });

    let success = false;
    try {
      if (options.channel === "EMAIL") {
        success = await this.emailProvider.send(to, message);
      } else if (options.channel === "SMS") {
        success = await this.smsProvider.send(to, message);
      } else if (options.channel === "WHATSAPP") {
        success = await this.whatsappProvider.send(to, message);
      }

      // Update status
      await prisma.notification.update({
        where: { id: dbNotif.id },
        data: {
          status: success ? "SENT" : "FAILED",
          sentAt: success ? new Date() : null,
        },
      });
    } catch (err) {
      console.error("[Notification Service] Error sending message:", err);
      await prisma.notification.update({
        where: { id: dbNotif.id },
        data: { status: "FAILED" },
      });
    }

    return success;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
