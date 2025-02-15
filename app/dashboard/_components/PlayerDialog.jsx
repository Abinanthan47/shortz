import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { db } from '@/config/db';
import { VideoData } from '@/config/schema';
import { eq } from 'drizzle-orm';

export default function PlayerDialog({ playVideo, videoId, onClose }) {
    const [openDialog, setOpenDialog] = useState(false);
    const [videoData, setVideoData] = useState(null);
    const [error, setError] = useState(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        setOpenDialog(true);
        videoId && getVideoData();
    }, [playVideo, videoId]);

    const getVideoData = async () => {
        try {
            const result = await db.select().from(VideoData).where(eq(VideoData.id, videoId));
            if (result.length > 0) {
                setVideoData(result[0]);
                generateVideo(result[0]);
            } else {
                setError('Video not found');
            }
        } catch (err) {
            console.error('Error fetching video data:', err);
            setError('Failed to fetch video data');
        }
    };

    const generateVideo = async (data: typeof VideoData.$inferSelect) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Video configuration
        const width = 300;
        const height = 450;
        const fps = 30;
        const duration = 5; // seconds

        canvas.width = width;
        canvas.height = height;

        // Create media recorder
        const stream = canvas.captureStream(fps);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            setVideoUrl(URL.createObjectURL(blob));
        };

        recorder.start();

        // Animation logic
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            
            // Clear canvas
            ctx.clearRect(0, 0, width, height);
            
            // Draw your video content based on videoData
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            
            // Example text animation
            ctx.fillStyle = '#000000';
            ctx.font = '24px Arial';
            ctx.fillText(data.textContent, 50, 50 + progress * 100);
            
            // Add more elements based on your videoData structure
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                recorder.stop();
            }
        };

        animate();
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
                                <canvas ref={canvasRef} style={{ display: 'none' }} />
                                {videoUrl && (
                                    <video 
                                        controls 
                                        src={videoUrl}
                                        style={{ width: 300, height: 450 }}
                                        className="mb-4"
                                    />
                                )}
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
