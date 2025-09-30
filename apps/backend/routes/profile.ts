import { Router, Request, Response } from 'express'
import { createProfileWithReturn, updateProfileWithReturn } from '../repositories/profile'

const profileRouter = Router()

profileRouter.post('/create', async (req: Request, res: Response) => {
	const { createFields } = req.body

	try {
		const profile = await createProfileWithReturn(createFields)
		res.json({ profile })
	} catch (err: any) {
		console.error('Error creating profile:', err.response?.data || err.message)
		res.status(500).json({ error: err.message || 'Failed to create profile' })
	}
})

profileRouter.post('/update', async (req: Request, res: Response) => {
	const { updateFields } = req.body

	try {
		const profile = await updateProfileWithReturn(updateFields)
		res.json({ profile })
	} catch (err: any) {
		console.error('Error updating profile:', err.response?.data || err.message)
		res.status(500).json({ error: err.message || 'Failed to update profile' })
	}
})

export default profileRouter


