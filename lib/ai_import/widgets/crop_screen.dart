import 'dart:typed_data';

import 'package:crop_your_image/crop_your_image.dart';
import 'package:flutter/material.dart';

import '../../core/theme.dart';
import '../../widgets/ui.dart';

class CropScreen extends StatefulWidget {
  const CropScreen({super.key, required this.bytes, required this.name});

  final Uint8List bytes;
  final String name;

  @override
  State<CropScreen> createState() => _CropScreenState();
}

class _CropScreenState extends State<CropScreen> {
  final CropController _controller = CropController();
  String? _error;
  bool _cropping = false;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.close_rounded),
        ),
        title: Text('Crop ${widget.name}', style: context.h3),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Crop(
                    image: widget.bytes,
                    controller: _controller,
                    interactive: true,
                    onCropped: (result) {
                      switch (result) {
                        case CropSuccess(:final croppedImage):
                          Navigator.of(context).pop(croppedImage);
                        case CropFailure(:final cause):
                          setState(() {
                            _cropping = false;
                            _error = 'Could not crop this image: $cause';
                          });
                      }
                    },
                  ),
                ),
              ),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  _error!,
                  style: context.small.copyWith(color: c.danger),
                ),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
              child: Row(
                children: [
                  Expanded(
                    child: GradientButton(
                      label: _cropping ? 'Cropping…' : 'Use this crop',
                      icon: Icons.crop_rounded,
                      onPressed: _cropping
                          ? null
                          : () {
                              setState(() {
                                _cropping = true;
                                _error = null;
                              });
                              _controller.crop();
                            },
                    ),
                  ),
                  const SizedBox(width: 10),
                  SizedBox(
                    height: 50,
                    child: OutlineButton(
                      label: 'Cancel',
                      onPressed: () => Navigator.of(context).maybePop(),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
