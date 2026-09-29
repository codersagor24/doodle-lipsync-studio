"""
PyCairo Frame Renderer for Doodle Lip-Sync Studio
Renders vector face layers (Eyes, Mouth, Eyebrows, Cheeks) to RGBA buffer.
Supports layer toggles, free-form transforms, and transparent/green-screen backgrounds.
"""

import math
import json
import os
import cairo


class FrameRenderer:
    def __init__(self, preset_data, width=1080, height=1080):
        self.preset = preset_data
        self.width = width
        self.height = height

    @classmethod
    def from_preset_file(cls, preset_path, width=1080, height=1080):
        with open(preset_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return cls(data, width, height)

    def render_frame(self, frame_data, layers=None, transform=None, bg_mode="greenscreen", bg_image_surface=None):
        """
        Renders a single frame and returns raw RGBA bytes.
        """
        if layers is None:
            layers = {"eyes": True, "mouth": True, "eyebrows": True, "cheeks": True}

        if transform is None:
            transform = {"cx": self.width / 2, "cy": self.height / 2, "scale_x": 1.0, "scale_y": 1.0, "rotation": 0.0}

        surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, self.width, self.height)
        ctx = cairo.Context(surface)

        # 1. Background
        if bg_mode == "greenscreen":
            ctx.set_source_rgb(0.0, 1.0, 0.0)  # Pure #00FF00
            ctx.paint()
        elif bg_mode == "composite" and bg_image_surface is not None:
            ctx.set_source_surface(bg_image_surface, 0, 0)
            ctx.paint()
        # For 'transparent', default is 0 alpha (clear)

        # 2. Face Transform
        ctx.save()
        ctx.translate(transform.get("cx", self.width / 2), transform.get("cy", self.height / 2))
        rot_rad = math.radians(transform.get("rotation", 0.0))
        ctx.rotate(rot_rad)
        ctx.scale(transform.get("scale_x", 1.0), transform.get("scale_y", 1.0))

        # 3. Draw Layers
        if layers.get("cheeks", True) and self.preset.get("cheeks", {}).get("enabled", False):
            self._draw_cheeks(ctx)

        if layers.get("eyebrows", True) and self.preset.get("eyebrows", {}).get("enabled", True):
            self._draw_eyebrows(ctx)

        if layers.get("eyes", True):
            self._draw_eyes(ctx, frame_data)

        if layers.get("mouth", True):
            self._draw_mouth(ctx, frame_data)

        ctx.restore()
        surface.flush()

        # Convert Cairo ARGB32 to standard RGBA bytes
        data = surface.get_data()
        return bytes(data)

    def _draw_cheeks(self, ctx):
        cfg = self.preset.get("cheeks", {})
        ctx.save()
        ctx.set_source_rgba(0.96, 0.25, 0.37, 0.45)
        rx = cfg.get("radius_x", 18)
        ry = cfg.get("radius_y", 10)

        for side in ["left", "right"]:
            pos = cfg.get(side, {"x": -116 if side == "left" else 116, "y": -8})
            ctx.save()
            ctx.translate(pos["x"], pos["y"])
            ctx.scale(rx, ry)
            ctx.arc(0, 0, 1.0, 0, 2 * math.pi)
            ctx.restore()
            ctx.fill()
        ctx.restore()

    def _draw_eyebrows(self, ctx):
        cfg = self.preset.get("eyebrows", {})
        ctx.save()
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_line_width(cfg.get("thickness", 5))
        ctx.set_source_rgb(0.07, 0.07, 0.07)

        w = cfg.get("width", 34)
        for side in ["left", "right"]:
            pos = cfg.get(side, {"x": -82 if side == "left" else 82, "y": -118})
            ctx.save()
            ctx.translate(pos["x"], pos["y"])
            ctx.move_to(-w / 2, 4)
            ctx.curve_to(0, -6, 0, -6, w / 2, 4)
            ctx.stroke()
            ctx.restore()
        ctx.restore()

    def _draw_eyes(self, ctx, frame_data):
        cfg = self.preset.get("eyes", {})
        shape = cfg.get("shape", "circle")
        r = cfg.get("radius", 40)
        pr = cfg.get("pupil_radius", 14)
        blink = frame_data.get("blink", 0.0)

        gaze_x = frame_data.get("gaze_x", 0.0)
        gaze_y = frame_data.get("gaze_y", 0.0)
        pupil_x = frame_data.get("pupil_x", 0.0)
        pupil_y = frame_data.get("pupil_y", 0.0)

        for side in ["left", "right"]:
            pos = cfg.get(side, {"x": -82 if side == "left" else 82, "y": -62})
            ctx.save()
            ctx.translate(pos["x"], pos["y"])

            if shape == "small_dot":
                # Minimalist dot eye
                if blink < 0.7:
                    ctx.arc(0, 0, r, 0, 2 * math.pi)
                    ctx.set_source_rgb(0.07, 0.07, 0.07)
                    ctx.fill()
                    # Highlight
                    ctx.arc(4, -4, 3, 0, 2 * math.pi)
                    ctx.set_source_rgba(1.0, 1.0, 1.0, 0.9)
                    ctx.fill()
                else:
                    # Blink line
                    ctx.move_to(-r, 0)
                    ctx.line_to(r, 0)
                    ctx.set_source_rgb(0.07, 0.07, 0.07)
                    ctx.set_line_width(4.0)
                    ctx.stroke()

            elif shape == "pie_cut_circle":
                # Rubber-Hose 1930s eye with rotating pie wedge
                pie_angle = math.radians(cfg.get("pie_angle", 55))
                # Compute angle towards gaze (default towards center if gaze is 0)
                if abs(gaze_x) > 0.01 or abs(gaze_y) > 0.01:
                    pupil_angle = math.atan2(gaze_y * 9, gaze_x * 16)
                else:
                    pupil_angle = math.atan2(pupil_y, pupil_x + (10 if side == "left" else -10))

                # Black circle
                ctx.arc(0, 0, r, 0, 2 * math.pi)
                ctx.set_source_rgb(0.07, 0.07, 0.07)
                ctx.fill()

                if blink < 0.8:
                    # White pie wedge
                    ctx.move_to(0, 0)
                    ctx.arc(0, 0, r - 3, pupil_angle - pie_angle / 2, pupil_angle + pie_angle / 2)
                    ctx.close_path()
                    ctx.set_source_rgb(1.0, 1.0, 1.0)
                    ctx.fill()

            else:
                # 1. Sclera
                ctx.arc(0, 0, r, 0, 2 * math.pi)
                ctx.set_source_rgb(1.0, 1.0, 1.0)
                ctx.fill_preserve()
                ctx.set_source_rgb(0.07, 0.07, 0.07)
                ctx.set_line_width(cfg.get("eye_stroke", 4.5))
                ctx.stroke()

                # 2. Pupil (Clipped inside eye white)
                ctx.save()
                ctx.arc(0, 0, r - 2, 0, 2 * math.pi)
                ctx.clip()

                max_disp = r - pr - 4
                tx = (gaze_x * max_disp) + pupil_x
                ty = (gaze_y * max_disp) + pupil_y
                dist = math.sqrt(tx * tx + ty * ty)
                if dist > max_disp and dist > 0:
                    tx = (tx / dist) * max_disp
                    ty = (ty / dist) * max_disp

                ctx.arc(tx, ty, pr, 0, 2 * math.pi)
                ctx.set_source_rgb(0.07, 0.07, 0.07)
                ctx.fill()

                # Specular highlight
                ho = cfg.get("highlight_offset", {"x": 6, "y": -6})
                hr = cfg.get("highlight_radius", 5)
                ctx.arc(tx + ho["x"], ty + ho["y"], hr, 0, 2 * math.pi)
                ctx.set_source_rgb(1.0, 1.0, 1.0)
                ctx.fill()

                # Eyelid blink mask
                if blink > 0:
                    lid_h = blink * (r * 2 + 8)
                    ctx.rectangle(-r - 4, -r - 4, (r + 4) * 2, lid_h)
                    ctx.set_source_rgb(0.07, 0.07, 0.07)
                    ctx.fill()

                ctx.restore()  # End clip

            ctx.restore()

    def _draw_mouth(self, ctx, frame_data):
        cfg = self.preset.get("mouth", {})
        pos = cfg.get("center", {"x": 0, "y": 68})
        w = cfg.get("base_width", 72) * frame_data.get("width_x", 1.0)
        max_h = cfg.get("max_open_height", 52)
        open_y = frame_data.get("open_y", 0.0)
        half_w = w / 2

        ctx.save()
        ctx.translate(pos["x"], pos["y"])
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)

        if open_y < 0.06:
            # Closed mouth resting smile line
            ctx.move_to(-half_w, 0)
            ctx.curve_to(-half_w / 2, 4, half_w / 2, 4, half_w, 0)
            ctx.set_source_rgb(0.07, 0.07, 0.07)
            ctx.set_line_width(cfg.get("stroke_width", 4.5))
            ctx.stroke()
        else:
            # Open talking mouth
            h = max(6, open_y * max_h)
            ctx.new_path()
            ctx.move_to(-half_w, 0)
            ctx.curve_to(0, -h * 0.15, 0, -h * 0.15, half_w, 0)
            ctx.curve_to(0, h * 1.3, 0, h * 1.3, -half_w, 0)
            ctx.close_path()

            # Fill cavity
            ctx.set_source_rgb(0.1, 0.04, 0.06)
            ctx.fill_preserve()

            # Clip for teeth and tongue
            ctx.save()
            ctx.clip()

            # Teeth
            teeth_h = min(h * 0.45, 14)
            ctx.rectangle(-half_w + 4, -4, (half_w - 4) * 2, teeth_h + 4)
            ctx.set_source_rgb(1.0, 1.0, 1.0)
            ctx.fill()

            # Tongue
            if open_y > 0.4:
                ctx.save()
                ctx.translate(0, h * 0.8)
                ctx.scale(half_w * 0.65, h * 0.5)
                ctx.arc(0, 0, 1.0, 0, 2 * math.pi)
                ctx.restore()
                ctx.set_source_rgb(0.94, 0.27, 0.27)
                ctx.fill()

            ctx.restore()  # End clip

            # Lip outline
            ctx.set_source_rgb(0.07, 0.07, 0.07)
            ctx.set_line_width(cfg.get("stroke_width", 4.5))
            ctx.stroke()

        ctx.restore()
