// src/app/api/settings/route.ts
import { NextResponse } from 'next/server';
import { getUserSettings, updateUserSettings } from '@/backend/services/settingsService'; // Assuming these exist
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// GET /api/settings - Get settings for the current user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userSettings = await getUserSettings(user.id); // Your function to get user settings

    if (!userSettings) {
         // This might happen if settings haven't been initialized for the user yet
         // You might return a default set of settings in this case instead of 404
         return NextResponse.json({ error: 'User settings not found' }, { status: 404 });
    }


    return NextResponse.json({ settings: userSettings });

  } catch (error: any) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch user settings' }, { status: 500 });
  }
}

// PUT /api/settings - Update settings for the current user
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const updateData = await request.json();
    // TODO: Add input validation for updateData
    // - Define the structure and types of valid settings
    // - Ensure users can only update settings they are allowed to
    // - Filter out any unexpected or malicious fields


     // Example validation:
     // const validSettings: string[] = ['emailNotificationsEnabled', 'timezone', 'preferredTheme']; // Define what settings can be updated
     // const validatedUpdateData: any = {};
     // for (const key in updateData) {
     //    if (validSettings.includes(key)) {
     //        // Add type/value validation here for each setting key
     //        validatedUpdateData[key] = updateData[key];
     //    }
     // }
      // if (Object.keys(validatedUpdateData).length === 0) {
      //     return NextResponse.json({ error: 'No valid settings provided for update' }, { status: 400 });
      // }


    const updatedSettings = await updateUserSettings(user.id, updateData); // Your function to update user settings

     if (!updatedSettings) {
         // This might happen if the user is somehow not found during the update
         return NextResponse.json({ error: 'Failed to update user settings (user not found)' }, { status: 404 });
     }


    return NextResponse.json({ message: 'Settings updated successfully', settings: updatedSettings });

  } catch (error: any) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user settings' }, { status: 500 });
  }
}
