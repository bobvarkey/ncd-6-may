import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../data/infection_repository.dart';
import '../navigation.dart';
import '../widgets/ui.dart';

class ProtocolsScreen extends StatefulWidget {
  const ProtocolsScreen({super.key, required this.repository});

  final InfectionRepository repository;

  @override
  State<ProtocolsScreen> createState() => _ProtocolsScreenState();
}

class _ProtocolsScreenState extends State<ProtocolsScreen> {
  final _search = TextEditingController();
  String _query = '';
  String _category = 'All';

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final protocols = widget.repository.filter(
      category: _category,
      query: _query,
    );
    final emergencyCount =
        widget.repository.protocols.where((p) => p.emergency).length;

    return SafeArea(
      bottom: false,
      child: Column(
        children: [
          Expanded(
            child: MaxWidth(
              width: 980,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Text('NCD Rx',
                          style: context.tiny.copyWith(
                              color: c.coral,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.4)),
                      const Spacer(),
                      TagPill(
                          label: '${widget.repository.protocols.length} protocols',
                          tone: 'coral'),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(
                        child: Text('Serious\ninfections',
                            style: context.display.copyWith(fontSize: 32)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: toneSoft(context, 'danger', 0.1),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                              color: c.danger.withValues(alpha: 0.2)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.emergency_outlined,
                                size: 13, color: c.danger),
                            const SizedBox(width: 5),
                            Text('$emergencyCount emergencies',
                                style: context.tiny.copyWith(
                                    color: c.danger,
                                    fontWeight: FontWeight.w800)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Empiric regimens with source control, monitoring, escalation and stewardship. Tap a protocol for the full plan.',
                    style: context.small,
                  ),
                  const SizedBox(height: 16),
                  SearchField(
                    controller: _search,
                    hint: 'Search a diagnosis, drug or red flag',
                    onChanged: (v) => setState(() => _query = v),
                    onClear: () {
                      _search.clear();
                      setState(() => _query = '');
                    },
                  ),
                  const SizedBox(height: 12),
                  FilterPills(
                    options: InfectionRepository.categories,
                    selected: _category,
                    onSelected: (v) => setState(() => _category = v),
                    padding: EdgeInsets.zero,
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: protocols.isEmpty
                        ? const EmptyState(
                            icon: Icons.search_off_rounded,
                            title: 'No matching protocol',
                            body:
                                'Try “sepsis”, “meningitis”, “malaria” or a drug name.',
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.only(bottom: 20),
                            itemCount: protocols.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 9),
                            itemBuilder: (context, index) {
                              final protocol = protocols[index];
                              return ProtocolTile(
                                title: protocol.label,
                                category: protocol.category,
                                workingDx: protocol.workingDx,
                                emergency: protocol.emergency,
                                onTap: () =>
                                    openProtocol(context, protocol),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
