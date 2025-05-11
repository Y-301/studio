// src/app/api/user/route.ts
import { NextResponse } from 'next/server';
import { getUserProfile, updateUserProfile } from '@/backend/services/userService'; // Assuming these exist
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// GET /api/user - Get the profile of the current user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // The user object from getCurrentUser might already contain the profile data,
    // or you might need a separate call to a userService function.
    // Assuming getUserProfile fetches additional profile details if needed.
    const userProfile = await getUserProfile(user.id); // Your function to get user profile

    if (!userProfile) {
        // This case should ideally not happen if getCurrentUser returned a valid user,
        // but including for robustness.
         return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }


    return NextResponse.json({ user: userProfile }); // Return the user profile data

  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch user profile' }, { status: 500 });
  }
}

// PUT /api/user - Update the profile of the current user
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const updateData = await request.json();
    // TODO: Add input validation for updateData
    // Ensure only allowed fields are updated and data types are correct

    // Example validation: only allow updating 'name' and 'settings'
    const allowedUpdates: any = {};
    if (updateData.name !== undefined) {
        // TODO: Validate name format/length
        allowedUpdates.name = updateData.name;
    }
     if (updateData.settings !== undefined && typeof updateData.settings === 'object') {
        // TODO: Validate structure/content of settings object
        allowedUpdates.settings = updateData.settings;
     }

     if (Object.keys(allowedUpdates).length === 0) {
        return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
     }


    const updatedUser = await updateUserProfile(user.id, allowedUpdates); // Your function to update user profile

    if (!updatedUser) {
        // This might happen if the user is somehow not found during the update
         return NextResponse.json({ error: 'Failed to update user profile (user not found)' }, { status: 404 });
    }


    return NextResponse.json({ message: 'User profile updated successfully', user: updatedUser });

  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user profile' }, { status: 500 });
  }
}

// DELETE /api/user - Optional: Allow users to delete their account
// This is a sensitive operation and requires careful implementation.
// export async function DELETE(request: Request) {
//   try {
//     const user = await getCurrentUser(request);
//     if (!user) {
//       return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
//     }
//     // TODO: Implement account deletion logic
//     // - Confirm the request (e.g., require password re-entry)
//     // - Delete user data from all relevant collections/tables
//     // - Invalidate session/tokens
//     // await deleteUserAccount(user.id); // Your function to delete the user
//     return NextResponse.json({ message: 'Account deleted successfully' });
//   } catch (error: any) {
//     console.error('Error deleting account:', error);
//     return NextResponse.json({ error: error.message || 'Failed to delete account' }, { status: 500 });
//   }
// }
