import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Player } from '@remotion/player';
import dynamic from 'next/dynamic';
import { db } from '@/config/db';
import { VideoData } from '@/config/schema';
import { eq } from 'drizzle-orm';

const RemotionVideo = dynamic(() => import('./RemotionVideo'), { ssr: false });

export default function PlayerDialog({ playVideo, videoId, onClose }) {
    const [openDialog, setOpenDialog] = useState(false);
    const [videoData, setVideoData] = useState(null);
    const [durationInFrames, setDurationInFrames] = useState(100);
    const [error, setError] = useState(null);

    const playerRef = useRef(null);

    useEffect(() => {
        setOpenDialog(true);
        videoId && getVideoData();
    }, [playVideo, videoId]);

    const getVideoData = async () => {
        try {
            const result = await db.select().from(VideoData).where(eq(VideoData.id, videoId));
            if (result.length > 0) {
                setVideoData(result[0]);
            } else {
                setError('Video not found');
            }
        } catch (err) {
            console.error('Error fetching video data:', err);
            setError('Failed to fetch video data');
        }
    };

    const handleClose = () => {
        setOpenDialog(false);
        onClose();
    };

    return (
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="bg-white flex flex-col justify-center items-center">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold my-5 text-center">Your Video</DialogTitle>
                    <DialogDescription>
                        {error ? (
                            <p className="text-red-500">{error}</p>
                        ) : (
                            <>
                                <div style={{ position: 'relative' }}>
                                    <Player
                                        ref={playerRef}
                                        component={RemotionVideo}
                                        durationInFrames={Math.round(durationInFrames)}
                                        compositionWidth={300}
                                        compositionHeight={450}
                                        fps={30}
                                        controls
                                        inputProps={{
                                            ...videoData,
                                            setDurationInFrames: (frames) => setDurationInFrames(Math.round(frames))
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col items-center gap-3 mt-4">
                                    <Button variant="ghost" onClick={handleClose}>Close</Button>
                                </div>
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
