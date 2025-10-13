import { Router, Request, Response } from 'express'
import { requireSupabaseUser } from '@/utils/supabaseClient.js'
import { createProfileWithReturn, updateProfileWithReturn } from '@/features/userProfile/profile.repo.js'

const profileRouter = Router()

profileRouter.post('/create', requireSupabaseUser, async (req: Request, res: Response) => {
	const { createFields } = req.body

	try {
		const supabaseAuthenticated = req.supabaseAsUser!;
		const profile = await createProfileWithReturn(supabaseAuthenticated, createFields)
		res.json({ profile })
	} catch (err: any) {
		console.error('Error creating profile:', err.response?.data || err.message)
		res.status(500).json({ error: err.message || 'Failed to create profile' })
	}
})

profileRouter.post('/update', requireSupabaseUser, async (req: Request, res: Response) => {
	const { updateFields } = req.body

	try {
		const supabaseAuthenticated = req.supabaseAsUser!;
		const profile = await updateProfileWithReturn(supabaseAuthenticated, updateFields)
		res.json({ profile })
	} catch (err: any) {
		console.error('Error updating profile:', err.response?.data || err.message)
		res.status(500).json({ error: err.message || 'Failed to update profile' })
	}
})

export default profileRouter


