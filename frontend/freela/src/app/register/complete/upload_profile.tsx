"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Check, ChevronLeft, ImagePlus, Move, ZoomIn } from "lucide-react";
import { motion, type Variants } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCroppedImg } from "@/lib/cropImage";
import { Slider } from "@/components/ui/slider";

import type { OnboardingFormData } from "./types";

type UploadProfileProps = {
  data: OnboardingFormData;
  updateData: (data: Partial<OnboardingFormData>) => void;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error?: string;
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: "easeOut",
    },
  },
};

export default function UploadProfile({
  data,
  updateData,
  onPrev,
  onSubmit,
  isSubmitting,
  error,
}: UploadProfileProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({
    x: 0,
    y: 0,
  });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [shouldSubmitAfterCrop, setShouldSubmitAfterCrop] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      setIsDragging(false);
      dragCounter.current = 0;
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        setCroppedAreaPixels(undefined);
        updateData({ profileImage: file });
      }
    }
  }, [updateData]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generatedImageRef = useRef<File | null>(null);
  const [previewCropUrl, setPreviewCropUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!data.profileImage) {
      setPreview(null);
      setPreviewCropUrl(null);
      return;
    }

    const url = URL.createObjectURL(data.profileImage);
    setPreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [data.profileImage]);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  useEffect(() => {
    if (!preview || !croppedAreaPixels || !canvasRef.current) {
      return;
    }

    const image = new Image();
    image.src = preview;

    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 200;
      canvas.height = 200;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      setPreviewCropUrl(canvas.toDataURL("image/webp", 0.92));
    };
  }, [preview, croppedAreaPixels]);

  const generateFinalImage = useCallback(async () => {
    if (!preview || !croppedAreaPixels) {
      return;
    }

    const cropped = await getCroppedImg(preview, croppedAreaPixels);
    generatedImageRef.current = cropped;
    updateData({ profileImage: cropped });
  }, [croppedAreaPixels, preview, updateData]);

  const handleSubmit = useCallback(async () => {
    if (!preview || !croppedAreaPixels) {
      onSubmit();
      return;
    }

    setIsGenerating(true);
    try {
      setShouldSubmitAfterCrop(true);
      await generateFinalImage();
    } catch {
      setShouldSubmitAfterCrop(false);
      setIsGenerating(false);
    }
  }, [croppedAreaPixels, generateFinalImage, onSubmit, preview]);

  useEffect(() => {
    if (!shouldSubmitAfterCrop || !generatedImageRef.current) {
      return;
    }

    if (data.profileImage !== generatedImageRef.current) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setShouldSubmitAfterCrop(false);
      setIsGenerating(false);
      onSubmit();
    });

    return () => cancelAnimationFrame(frame);
  }, [data.profileImage, onSubmit, shouldSubmitAfterCrop]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-lg space-y-6 text-center"
    >
      <motion.h2
        variants={itemVariants}
        className="text-3xl font-bold tracking-tight text-slate-950"
      >
        Monte seu Perfil
      </motion.h2>
      <motion.p variants={itemVariants} className="text-slate-500">
        Adicione uma foto e uma bio.
      </motion.p>

      {error ? (
        <motion.div
          variants={itemVariants}
          className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700"
        >
          {error}
        </motion.div>
      ) : null}

      <motion.div
        variants={itemVariants}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <FieldGroup className="gap-5">
          <Field className="gap-2">
            <FieldLabel
              htmlFor="profile-image"
              className="text-sm font-medium text-slate-700"
            >
              Foto de Perfil
            </FieldLabel>

            <div className="flex items-center justify-center gap-8">
              <div className="space-y-3">
                <div
                  className={`relative h-72 w-72 overflow-hidden rounded-3xl border shadow-sm transition-all duration-200 ${isDragging
                      ? "border-blue-500 bg-blue-50/50 ring-4 ring-blue-50"
                      : "border-slate-300 bg-slate-100"
                    }`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {/* Dropzone overlay (always pointer-events-none to prevent blocking and flickering) */}
                  <div
                    className={`pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-blue-50/90 backdrop-blur-sm transition-all duration-200 ${isDragging ? "opacity-100" : "opacity-0"
                      }`}
                  >
                    <ImagePlus className="size-12 animate-bounce text-blue-600" />
                    <span className="text-sm font-semibold text-blue-700">
                      Solte a foto aqui
                    </span>
                  </div>

                  <div className="h-full w-full">
                    {!preview ? (
                      <label
                        htmlFor="profile-image"
                        className="flex h-full cursor-pointer flex-col items-center justify-center gap-4"
                      >
                        <ImagePlus className="size-10 text-slate-400" />
                        <span className="text-sm text-slate-500">
                          Clique ou arraste para enviar uma foto
                        </span>
                      </label>
                    ) : (
                      <Cropper
                        image={preview}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        objectFit="cover"
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    )}
                  </div>
                </div>

                {preview && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <ZoomIn className="size-4" />
                      Zoom
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>1x</span>
                        <span>{zoom.toFixed(1)}x</span>
                        <span>3x</span>
                      </div>
                      <Slider
                        min={1}
                        max={3}
                        step={0.05}
                        value={[zoom]}
                        onValueChange={(values) => setZoom(Array.isArray(values) ? values[0] : values)}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                <p className="text-center text-xs text-slate-500">
                  Arraste a imagem para posicionar seu rosto. Use o zoom se necessário.
                </p>
              </div>

              <div className="hidden md:flex">
                <Move className="size-8 text-slate-300" />
              </div>

              <div className="flex flex-col items-center gap-3">
                <span className="text-xs font-medium text-slate-500">Preview</span>
                <Avatar className="h-28 w-28 border-[5px] border-white shadow-xl ring-1 ring-slate-200">
                  <AvatarImage
                    src={previewCropUrl ?? preview ?? undefined}
                    alt="Prévia da foto"
                    className="h-full w-full object-cover"
                  />
                  <AvatarFallback className="bg-slate-200 text-slate-400">
                    <ImagePlus className="size-6" />
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {preview && (
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    updateData({
                      profileImage: null,
                    });
                    setZoom(1);
                    setCrop({
                      x: 0,
                      y: 0,
                    });
                    setCroppedAreaPixels(undefined);
                  }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Trocar foto
                </button>
              </div>
            )}

            <Input
              id="profile-image"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) {
                  setZoom(1);
                  setCrop({ x: 0, y: 0 });
                  setCroppedAreaPixels(undefined);
                  updateData({
                    profileImage: e.target.files[0],
                  });
                }
              }}
            />
          </Field>

          <Field className="gap-2">
            <FieldLabel
              htmlFor="profile-title"
              className="text-sm font-medium text-slate-700"
            >
              Título Profissional
            </FieldLabel>
            <Input
              id="profile-title"
              type="text"
              className="h-11 rounded-lg border-slate-300 px-4 text-sm shadow-none focus-visible:border-blue-600 focus-visible:ring-blue-100"
              placeholder="Ex: Desenvolvedor Frontend Freelancer"
              value={data.profileTitle}
              onChange={(e) => updateData({ profileTitle: e.target.value })}
            />
          </Field>

          <Field className="gap-2">
            <FieldLabel
              htmlFor="profile-bio"
              className="text-sm font-medium text-slate-700"
            >
              Bio
            </FieldLabel>
            <textarea
              id="profile-bio"
              rows={4}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-4 py-3 text-sm outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="Escreva um resumo curto sobre você, sua experiência e no que você se destaca."
              value={data.profileDescription}
              onChange={(e) =>
                updateData({ profileDescription: e.target.value })
              }
            />
            <FieldDescription className="text-xs text-slate-500">
              Uma descrição curta ajuda seu perfil a parecer mais completo.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between pt-4"
      >
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-950"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </button>
        <Button
          onClick={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting || isGenerating}
          className="rounded-full bg-blue-600 px-8 hover:bg-blue-700"
        >
          {isGenerating
            ? "Processando foto..."
            : isSubmitting
              ? "Finalizando..."
              : "Finalizar Cadastro"}
          <Check className="ml-1 size-4" />
        </Button>
      </motion.div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </motion.div>
  );
}
