import { db } from "../server/db";
import { users } from "@shared/schema";
import { hashPassword } from "../server/auth";
import { CONFIG } from "../server/config";
import { eq } from "drizzle-orm";

async function createDefaultOperator() {
  try {
    // Use centralized config instead of hardcoded values
    const operatorUsername = process.env.OPERATOR_USERNAME || CONFIG.auth.adminUsername;
    const operatorPassword = process.env.OPERATOR_PASSWORD || CONFIG.auth.adminPassword;

    const existingOperator = await db
      .select()
      .from(users)
      .where(eq(users.username, operatorUsername))
      .limit(1);

    if (existingOperator.length > 0) {
      console.log('Default operator user already exists');
      return;
    }

    const hashedPassword = await hashPassword(operatorPassword);

    const [newOperator] = await db
      .insert(users)
      .values({
        username: operatorUsername,
        password: hashedPassword,
        role: 'operator',
      })
      .returning();

    console.log('Default operator created successfully');
    console.log('Username:', operatorUsername);
    console.log('Password:', operatorPassword);
    console.log('Role:', newOperator.role);

  } catch (error) {
    console.error('Error creating default operator:', error);
  }
}

createDefaultOperator().then(() => process.exit(0));

export { createDefaultOperator };