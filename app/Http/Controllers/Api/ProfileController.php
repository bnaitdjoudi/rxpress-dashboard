<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user()->load('profile');
        return response()->json($user);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'email'         => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password'      => 'sometimes|string|min:8|confirmed',
            'phone'         => 'nullable|string|max:20',
            'avatar'        => 'nullable|string|max:500',
            'bio'           => 'nullable|string|max:1000',
            'address'       => 'nullable|string|max:255',
            'city'          => 'nullable|string|max:100',
            'country'       => 'nullable|string|max:100',
            'postal_code'   => 'nullable|string|max:20',
            'company'       => 'nullable|string|max:255',
            'website'       => 'nullable|string|max:255',
        ]);

        // Mise à jour des champs User
        $userFields = array_intersect_key($validated, array_flip(['name', 'email', 'password']));
        if (isset($userFields['password'])) {
            $userFields['password'] = Hash::make($userFields['password']);
        }
        if (!empty($userFields)) {
            $user->update($userFields);
        }

        // Mise à jour ou création du profil
        $profileFields = array_diff_key($validated, array_flip(['name', 'email', 'password']));
        $user->profile()->updateOrCreate(['user_id' => $user->id], $profileFields);

        return response()->json($user->load('profile'));
    }
}
