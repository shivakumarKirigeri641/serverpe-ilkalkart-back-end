const getProductsQuery = () => {
  return `SELECT json_agg(row_data) AS data
FROM (
    SELECT json_build_object(
        'id', MIN(i.id),
        'inventory_id', MAX(i.inventory_id),
        'title', MAX(i.title),
        'type_name', MAX(i.type_name),
        'description1', MAX(i.description1),
        'description2', MAX(i.description2),
        'material', MAX(i.material),
        'border', MAX(i.border),
        'pallu', MAX(i.pallu),
        'blouse', MAX(i.blouse),
        'color', MAX(i.color),

        'quantity', SUM(i.quantity),

        'base_price',
        ROUND(
            MAX(i.act_price) +
            (
                MAX(i.act_price) * MAX(m.margin_percent) / 100.0
            ),
            2
        ),

        'custom_message',
        CASE
            WHEN SUM(i.quantity) > 3 THEN 'In Stock'
            WHEN SUM(i.quantity) = 2 THEN 'Only 2 left'
            WHEN SUM(i.quantity) = 1 THEN 'Only 1 left'
            ELSE 'Only 3 left'
        END,

        'img_directory', MAX(i.img_directory),
        'video_directory', MAX(i.video_directory),
        'combined_code', i.combined_code
    ) AS row_data

    FROM public.inventory_elements i

    LEFT JOIN public.margin_ranges m
        ON i.act_price BETWEEN m.price_from AND m.price_until

    GROUP BY i.combined_code
) final_data;`;
};
module.exports = getProductsQuery;
